"""Floating shelf with an LED strip under its front edge -> shelf.glb

Local frame: origin at the centre of the board's top face (no rotation). The books, figurine, candle
and plant that stand on it arrive in Phase 3.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import SHELF  # noqa: E402  (imports bpy, which provides mathutils)
from mathutils import Vector  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, box, descendants, empty  # noqa: E402

NAME = "shelf"
EXPECT = dict(
    names=["shelf_board", "shelf_led"],
    bounds=((SHELF["x"][0] - 0.01, -0.001, SHELF["top"] - 0.06), (SHELF["x"][1] + 0.01, SHELF["depth"] + 0.01,
                                                                 SHELF["top"] + 0.001)),
    max_tris=500,
)


def top_center():
    return Vector(((SHELF["x"][0] + SHELF["x"][1]) / 2, 0, SHELF["top"]))


def build():
    root = empty(NAME, top_center())
    length = SHELF["x"][1] - SHELF["x"][0]
    d, t = SHELF["depth"], SHELF["thickness"]
    box("shelf_board", (length, d, t), (0, d / 2, -t / 2), materials.get("shelf_wood"), bev=0.003, parent=root)
    # the strip runs just behind the front lip on the underside
    box("shelf_led", (length - 0.04, 0.008, 0.004), (0, d - 0.02, -t - 0.002), materials.get("shelf_led"),
        parent=root)
    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
