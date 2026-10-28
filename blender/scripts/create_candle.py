"""A candle in an amber glass cup, beside the figurine -> candle.glb

Pivot: bottom centre. `candle_flame` is emissive; the site places a small warm light at
`candle_light_anchor`.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import CANDLE, SHELF, SHELF_PROPS  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, cyl, descendants, empty, sphere  # noqa: E402

NAME = "candle"
EXPECT = dict(
    names=["candle", "candle_cup", "candle_wax", "candle_flame", "candle_light_anchor"],
    bounds=((-0.2, 0.0, SHELF["top"] - 0.001), (-0.07, SHELF["depth"], SHELF["top"] + 0.08)),
    max_tris=1500,
)

CUP_R = 0.021


def flame_height():
    return CANDLE["height"] - 0.012


def build():
    root = empty(NAME, (CANDLE["x"], SHELF_PROPS["candle_y"], SHELF["top"]))
    cup_h = CANDLE["height"] * 0.75
    cyl("candle_cup", CUP_R, cup_h, (0, 0, cup_h / 2), materials.get("candle_glass"), verts=24, bev=0.0015,
        parent=root)
    wax_h = cup_h * 0.7
    cyl("candle_wax", CUP_R - 0.002, wax_h, (0, 0, wax_h / 2 + 0.001), materials.get("candle_wax"), verts=24,
        parent=root)
    sphere("candle_flame", 0.004, (0, 0, flame_height()), materials.get("candle_flame"), scale=(1, 1, 2.2),
           parent=root, seg=10, rings=6)
    empty("candle_light_anchor", (0, 0, flame_height()), parent=root)
    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
