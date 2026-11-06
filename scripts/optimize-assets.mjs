// Compresses the Blender pipeline's raw output into what the site serves:
//
//   blender/build/models/*.glb      -> public/models/*.glb       meshopt geometry, WebP textures
//   blender/build/lightmaps/*.png   -> public/lightmaps/*.webp   near-lossless WebP
//
// Lightmaps are near-lossless rather than lossy: lossy WebP broke the dark falloffs into blocks, while
// near-lossless keeps every texel within 2 of 255 of the bake, its dither included. Files whose output
// is newer than their source are skipped; outputs with no source are removed.
//
//   node scripts/optimize-assets.mjs [--force]      (pnpm assets; blender/regenerate.sh runs it)
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, textureCompress } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const JOBS = [
  {
    from: "blender/build/models",
    to: "public/models",
    ext: [".glb", ".glb"],
    run: optimizeModel,
  },
  {
    from: "blender/build/lightmaps",
    to: "public/lightmaps",
    ext: [".png", ".webp"],
    run: optimizeLightmap,
  },
];
const force = process.argv.includes("--force");

await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });

async function optimizeModel(src, dst) {
  const doc = await io.read(src);
  await doc.transform(
    textureCompress({ encoder: sharp, targetFormat: "webp", quality: 90 }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );
  fs.writeFileSync(dst, await io.writeBinary(doc));
}

async function optimizeLightmap(src, dst) {
  await sharp(src)
    .webp({ nearLossless: true, quality: 60, effort: 6 })
    .toFile(dst);
}

let before = 0;
let after = 0;
for (const job of JOBS) {
  const from = path.join(ROOT, job.from);
  const to = path.join(ROOT, job.to);
  if (!fs.existsSync(from)) {
    console.error(`No ${job.from}: run blender/regenerate.sh first.`);
    process.exit(1);
  }
  fs.mkdirSync(to, { recursive: true });
  const [inExt, outExt] = job.ext;
  const sources = fs.readdirSync(from).filter((f) => f.endsWith(inExt));
  const wanted = new Set(sources.map((f) => path.basename(f, inExt) + outExt));
  for (const f of sources) {
    const src = path.join(from, f);
    const dst = path.join(to, path.basename(f, inExt) + outExt);
    const fresh =
      !force &&
      fs.existsSync(dst) &&
      fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs;
    if (!fresh) {
      await job.run(src, dst);
      console.log(`${job.to}/${path.basename(dst)}`);
    }
    before += fs.statSync(src).size;
    after += fs.statSync(dst).size;
  }
  for (const f of fs.readdirSync(to)) {
    if (!wanted.has(f)) {
      fs.rmSync(path.join(to, f));
      console.log(`removed ${job.to}/${f}`);
    }
  }
}
const mb = (n) => (n / 2 ** 20).toFixed(1);
console.log(`${mb(before)} MiB -> ${mb(after)} MiB`);
