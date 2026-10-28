"""Back wall, left wall and floor -> room.glb"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import LEFT_WALL_X, ROOM  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, box, empty  # noqa: E402

NAME = "room"
EXPECT = dict(
    names=["room_back_wall", "room_left_wall", "room_floor"],
    bounds=((-3.6, -0.15, -0.1), (LEFT_WALL_X + 0.15, 5.1, ROOM["height"] + 0.01)),
    max_tris=1000,
)


def build():
    root = empty(NAME)
    wall = materials.get("wall")
    h, t = ROOM["height"], ROOM["wall_thickness"]

    x0, x1 = ROOM["back_wall_x"]
    back = box("room_back_wall", (x1 - x0, t, h), ((x0 + x1) / 2, -t / 2, h / 2), wall, parent=root)

    y0, y1 = ROOM["left_wall_y"]
    left = box("room_left_wall", (t, y1 - y0, h), (LEFT_WALL_X + t / 2, (y0 + y1) / 2, h / 2), wall, parent=root)

    (fx0, fx1), (fy0, fy1) = ROOM["floor_x"], ROOM["floor_y"]
    floor = box("room_floor", (fx1 - fx0, fy1 - fy0, 0.05), ((fx0 + fx1) / 2, (fy0 + fy1) / 2, -0.025),
                materials.get("floor"), parent=root)

    for o in (back, left, floor):
        add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
