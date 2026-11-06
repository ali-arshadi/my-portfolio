"""Renders the opening frame as a still for the site -> src/assets/opening-frame.webp

    python -I scripts/render_still.py [--samples 160] [--res 1920x1080]

The hero shows it at once while the scene loads, and as the whole hero in the static fallback (narrow
screens, no WebGL 2); see src/components/hero/Hero.tsx. Rerun it whenever the scene changes.
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

from PIL import Image  # noqa: E402

import build_scene  # noqa: E402

OUT = os.path.join(REPO, "src", "assets", "opening-frame.webp")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--samples", type=int, default=160)
    ap.add_argument("--res", default="1920x1080")
    a = ap.parse_args()
    build_scene.build_all()
    png = os.path.join(REPO, "blender", "build", "opening-frame.png")
    os.makedirs(os.path.dirname(png), exist_ok=True)
    build_scene.render(png, build_scene.parse_res(a.res), a.samples)
    Image.open(png).convert("RGB").save(OUT, quality=88, method=6)
    print("still ->", os.path.relpath(OUT, REPO), f"{os.path.getsize(OUT) / 1024:.0f} KiB")


if __name__ == "__main__":
    main()
