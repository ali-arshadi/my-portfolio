"""Renders the opening frame and compares it with the reference image.

    python -I scripts/compare.py --out docs/reference/phase1-blender [--samples 24]

Writes <out>-render.png, <out>-overlay.png (50/50 blend, configured screen outlined in green) and <out>-edges.png (reference edges in
orange over the render's edges in cyan), all at the reference's aspect ratio.
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps  # noqa: E402

from build_scene import build_all, render  # noqa: E402

REFERENCE = os.path.join(REPO, "docs", "reference", "reference.webp")


def edges(img):
    g = ImageOps.autocontrast(img.convert("L"), cutoff=1).filter(ImageFilter.FIND_EDGES)
    return g.point(lambda v: 255 if v > 40 else 0)


def screen_outline(size):
    """The configured monitor screen projected through the scene camera, in pixels."""
    import bpy
    from bpy_extras.object_utils import world_to_camera_view
    from mathutils import Matrix, Vector

    import config as C
    m = C.MONITOR
    turn = Matrix.Rotation(m["yaw"], 3, "Z")
    c = m["pos"] + turn @ m["screen_center"]
    hw, hh = m["screen_size"][0] / 2, m["screen_size"][1] / 2
    sc = bpy.context.scene
    pts = []
    for o in [(hw, 0, hh), (-hw, 0, hh), (-hw, 0, -hh), (hw, 0, -hh)]:
        p = world_to_camera_view(sc, sc.camera, c + turn @ Vector(o))
        pts.append((p.x * size[0], (1 - p.y) * size[1]))
    return pts


def compare(render_path, out):
    ref = Image.open(REFERENCE).convert("RGB")
    ren = Image.open(render_path).convert("RGB").resize(ref.size, Image.LANCZOS)
    overlay = Image.blend(ref, ren, 0.5)
    ImageDraw.Draw(overlay).polygon(screen_outline(ref.size), outline=(0, 255, 120), width=2)
    overlay.save(f"{out}-overlay.png")

    black = Image.new("RGB", ref.size)
    ref_e, ren_e = edges(ref), edges(ren)
    lines = Image.composite(Image.new("RGB", ref.size, (0, 220, 255)), black, ren_e)
    lines = ImageChops.lighter(lines, Image.composite(Image.new("RGB", ref.size, (255, 140, 0)), black, ref_e))
    lines.save(f"{out}-edges.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="docs/reference/compare")
    ap.add_argument("--samples", type=int, default=24)
    a = ap.parse_args()
    out = os.path.join(REPO, a.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)

    w, h = Image.open(REFERENCE).size
    build_all()
    path = render(f"{out}-render.png", (w // 2, h // 2), a.samples)
    compare(path, out)
    print("wrote", *(os.path.relpath(f"{out}-{k}.png", REPO) for k in ("render", "overlay", "edges")))


if __name__ == "__main__":
    main()
