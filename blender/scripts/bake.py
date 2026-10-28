"""Bakes the scene's lighting into two lightmaps per asset -> public/lightmaps/<asset>.<layer>.png

Run through export_all.py (the default for `pnpm models`), so every lightmap is baked against the exact
UV layout of the GLB written in the same run. Standalone, for quick experiments:

    python -I scripts/bake.py [--samples 256] [--only desk,keyboard] [--scale 0.5]

Each asset's meshes share one lightmap atlas (the "lightmap" UV set, TEXCOORD_1 in the GLB). The bake
records light only (Cycles' diffuse direct + indirect, without the surface colour), so the site
multiplies it by each material's own colour. Two layers are baked, see lights.py:

    base  everything that stays on
    lamp  the desk lamp alone; the site scales it by the lamp level, so the lamp can fade in and out

Emissive and transparent surfaces (screen, LED, bulb, flame, glass) are not baked: they light the
scene, and the site renders them as they are.

Light values are stored as 8-bit sRGB-encoded PNGs of `value / LIGHTMAP_SCALE`; the sRGB curve spends
the 8 bits on the dark end, which this scene is mostly made of. Sampled as sRGB textures, the site gets
the linear value back for free and multiplies by LIGHTMAP_SCALE.
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from PIL import Image, ImageFilter  # noqa: E402

import build_scene  # noqa: E402
import lights  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import LIGHTMAP_UV, descendants  # noqa: E402

OUT_DIR = os.path.join(REPO, "public", "lightmaps")
LIGHTMAP_SCALE = 4.0
LAYERS = ("base", "lamp")

# Atlas size per asset, by how much of the frame it covers.
SIZES = {
    "room": 1024, "desk": 1024, "monitor": 512, "keyboard": 512, "desk_lamp": 512, "wall_poster": 512,
    "shelf": 256, "books": 256, "figurine": 256, "candle": 128, "shelf_plant": 512, "floor_plant": 512,
}


def baked(o):
    """Meshes that get a lightmap: not hidden, not emissive, not see-through."""
    if o.type != "MESH" or o.hide_render:
        return False
    for m in o.data.materials:
        spec = materials.LIBRARY.get(m.name, {})
        if "emit" in spec or spec.get("emit_image") or spec.get("alpha", 1) < 1:
            return False
    return True


def target_node(m):
    node = m.node_tree.nodes.get("bake_target")
    if not node:
        node = m.node_tree.nodes.new("ShaderNodeTexImage")
        node.name = "bake_target"
    return node


def bake_asset(root, size, layer):
    meshes = [o for o in descendants(root) if baked(o)]
    img = bpy.data.images.new(f"{root.name}.{layer}", size, size, float_buffer=True)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in meshes:
        o.select_set(True)
        o.data.uv_layers.active = o.data.uv_layers[LIGHTMAP_UV]
        for m in o.data.materials:
            node = target_node(m)
            node.image = img
            m.node_tree.nodes.active = node
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=4, margin_type="EXTEND",
                        use_clear=True)
    for o in meshes:
        o.data.uv_layers.active = o.data.uv_layers[0]
    pixels = np.empty(size * size * 4, dtype=np.float32)
    img.pixels.foreach_get(pixels)
    bpy.data.images.remove(img)
    # Blender stores rows bottom-up; PNG rows run top-down, matching glTF's flipped v
    return pixels.reshape(size, size, 4)[::-1, :, :3], len(meshes)


def encode(light):
    """Linear light -> 8-bit sRGB of light / LIGHTMAP_SCALE."""
    x = np.clip(light / LIGHTMAP_SCALE, 0, 1)
    srgb = np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(x, 1 / 2.4) - 0.055)
    img = Image.fromarray(np.round(srgb * 255).astype(np.uint8), "RGB")
    # a very light blur hides the last of the sampling noise without smearing across UV islands
    return img.filter(ImageFilter.GaussianBlur(0.6))


def same_image(path, img, tol=1.5):
    """Keep an existing lightmap when the new bake differs only by noise (mean difference in 8-bit steps)."""
    if not os.path.exists(path):
        return False
    old = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    new = np.asarray(img, dtype=np.float32)
    return old.shape == new.shape and float(np.abs(old - new).mean()) < tol


def setup(samples):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.seed = 0
    sc.render.threads_mode = "FIXED"
    sc.render.threads = max(1, (os.cpu_count() or 2) - 2)
    sc.render.bake.use_pass_direct = True
    sc.render.bake.use_pass_indirect = True
    sc.render.bake.use_pass_color = False


def bake_all(built, samples=256, only=(), scale=1.0):
    """Bake every asset in `built` ({name: (root, stats)}); returns {name: {layer: published path}}."""
    setup(samples)
    os.makedirs(OUT_DIR, exist_ok=True)
    out = {}
    for name, (root, _stats) in built.items():
        if only and name not in only:
            continue
        size = max(64, int(SIZES[name] * scale))
        for layer in LAYERS:
            lights.use_layers(layer)
            light, count = bake_asset(root, size, layer)
            path = os.path.join(OUT_DIR, f"{name.replace('_', '-')}.{layer}.png")
            img = encode(light)
            kept = same_image(path, img)
            if not kept:
                img.save(path)
            peak = float(light.max())
            print(f"{name}.{layer}: {count} meshes, {size}px, peak {peak:.2f}"
                  f"{' (clipped)' if peak > LIGHTMAP_SCALE else ''}{', unchanged' if kept else ''}", flush=True)
            out.setdefault(name, {})[layer] = "/" + os.path.relpath(path, os.path.join(REPO, "public"))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--samples", type=int, default=256)
    ap.add_argument("--only", default="")
    ap.add_argument("--scale", type=float, default=1.0, help="multiply atlas sizes (for quick test bakes)")
    a = ap.parse_args()
    bake_all(build_scene.build_all(), a.samples, set(filter(None, a.only.split(","))), a.scale)


if __name__ == "__main__":
    main()
