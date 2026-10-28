"""Desk top and legs -> desk.glb"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import DESK, DESK_Z  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, box, empty  # noqa: E402

NAME = "desk"
EXPECT = dict(
    names=["desk_top"] + [f"desk_leg_{i}" for i in range(4)],
    bounds=((DESK["x"][0], 0.0, 0.0), (DESK["x"][1], DESK["depth"], DESK_Z + 0.001)),
    max_tris=1000,
)


def build():
    root = empty(NAME)
    (x0, x1), d, t = DESK["x"], DESK["depth"], DESK["thickness"]
    top = box("desk_top", (x1 - x0, d, t), ((x0 + x1) / 2, d / 2, DESK_Z - t / 2), materials.get("desk_wood"),
              bev=0.004, parent=root)
    add_lightmap_uv(top)

    leg_h = DESK_Z - t
    i = DESK["leg_inset"]
    corners = [(x1 - i, i), (x1 - i, d - i), (x0 + i, i), (x0 + i, d - i)]
    for n, (x, y) in enumerate(corners):
        leg = box(f"desk_leg_{n}", (DESK["leg"], DESK["leg"], leg_h), (x, y, leg_h / 2), materials.get("desk_leg"),
                  parent=root)
        add_lightmap_uv(leg)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
