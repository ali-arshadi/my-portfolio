"""Framed "Build / Ship / Improve / Repeat." poster on the left wall -> wall-poster.glb

Local frame: origin on the wall surface at the centre of the frame opening; the poster faces -x (into
the room), +y runs along the wall toward the viewer, +z is up.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import LEFT_WALL_X, POSTER  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, box, descendants, empty, join, plane  # noqa: E402

NAME = "wall_poster"
EXPECT = dict(
    names=["poster_frame", "poster_mat", "poster_print", "poster_glass"],
    bounds=((LEFT_WALL_X - 0.04, 0.0, 0.8), (LEFT_WALL_X + 0.001, 0.75, 1.7)),
    max_tris=1000,
)


def print_size():
    w, h = POSTER["opening"]
    return w - 2 * POSTER["mat_width"], h - 2 * POSTER["mat_width"]


def build():
    root = empty(NAME, POSTER["center"])
    w, h = POSTER["opening"]
    b, d = POSTER["frame_border"], POSTER["frame_depth"]
    wood = materials.get("frame_wood")

    # four mitred-looking sides, merged into one mesh
    sides = [
        box("frame_top", (d, w + 2 * b, b), (-d / 2, 0, h / 2 + b / 2), wood, bev=0.002),
        box("frame_bottom", (d, w + 2 * b, b), (-d / 2, 0, -h / 2 - b / 2), wood, bev=0.002),
        box("frame_left", (d, b, h), (-d / 2, w / 2 + b / 2, 0), wood, bev=0.002),
        box("frame_right", (d, b, h), (-d / 2, -w / 2 - b / 2, 0), wood, bev=0.002),
    ]
    frame = join("poster_frame", sides)
    frame.parent = root

    mat_x = -0.022  # the mat and print sit 8 mm behind the frame's front face
    box("poster_mat", (0.004, w, h), (mat_x + 0.002, 0, 0), materials.get("poster_mat"), parent=root)
    pw, ph = print_size()
    plane("poster_print", pw, ph, (mat_x - 0.0005, 0, 0), materials.get("poster_print"), facing="-x", parent=root)
    plane("poster_glass", w, h, (-d + 0.003, 0, 0), materials.get("glass"), facing="-x", parent=root)

    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
