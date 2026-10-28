"""Tenkeyless keyboard: case plus 87 keycaps merged into one mesh -> keyboard.glb

Local frame: origin at the centre of the case base, +y toward the viewer (space bar side), +x to the
viewer's left (Esc side). Key positions are in key units (u) from the left edge of each row.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402  (must load before bmesh/mathutils)
import bmesh  # noqa: E402

from config import KEYBOARD  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, assign, bevel, box, empty, join  # noqa: E402

NAME = "keyboard"
EXPECT = dict(
    names=["keyboard_case", "keyboard_keys"],
    bounds=((-0.66, 0.6, KEYBOARD["center"].z - 0.002), (-0.24, 0.82, KEYBOARD["center"].z + 0.05)),
    max_tris=12000,
)

U = 0.019  # key pitch
GAP = 0.0025  # space between neighbouring caps
MARGIN = 0.008  # case border around the keys
CASE_H = 0.018
CAP_H = 0.009
NAV = 15.25  # navigation cluster starts here

# (row offset from the back in u, [(start u, width u), ...])
ROWS = [
    (0, [(0, 1)] + [(2 + i, 1) for i in range(4)] + [(6.5 + i, 1) for i in range(4)]
     + [(11 + i, 1) for i in range(4)] + [(NAV + i, 1) for i in range(3)]),
    (1.5, [(i, 1) for i in range(13)] + [(13, 2)] + [(NAV + i, 1) for i in range(3)]),
    (2.5, [(0, 1.5)] + [(1.5 + i, 1) for i in range(12)] + [(13.5, 1.5)] + [(NAV + i, 1) for i in range(3)]),
    (3.5, [(0, 1.75)] + [(1.75 + i, 1) for i in range(11)] + [(12.75, 2.25)]),
    (4.5, [(0, 2.25)] + [(2.25 + i, 1) for i in range(10)] + [(12.25, 2.75), (NAV + 1, 1)]),
    (5.5, [(0, 1.25), (1.25, 1.25), (2.5, 1.25), (3.75, 6.25), (10, 1.25), (11.25, 1.25), (12.5, 1.25),
           (13.75, 1.25)] + [(NAV + i, 1) for i in range(3)]),
]
COLS = NAV + 3
DEPTH_U = 6.5


def keycap(name, width_u, loc, m):
    """A slightly tapered cap: the top face is narrower than the base, like a real keycap profile."""
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = (width_u * U - GAP, U - GAP, CAP_H)
    bpy.ops.object.transform_apply(scale=True)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    top = [v for v in bm.verts if v.co.z > 0]
    inset = 0.0018
    for v in top:
        v.co.x -= inset if v.co.x > 0 else -inset
        v.co.y -= inset if v.co.y > 0 else -inset
    bm.to_mesh(o.data)
    bm.free()
    bevel(o, 0.0008, 1)
    o.location = loc
    assign(o, m)
    return o


def build():
    c = KEYBOARD["center"]
    root = empty(NAME, c, (0, 0, KEYBOARD["yaw"]))
    width, depth = COLS * U + 2 * MARGIN, DEPTH_U * U + 2 * MARGIN
    case = box("keyboard_case", (width, depth, CASE_H), (0, 0, CASE_H / 2), materials.get("keyboard_case"),
               bev=0.003, parent=root)

    key = materials.get("keyboard_key")
    left, back = width / 2 - MARGIN, -depth / 2 + MARGIN
    caps = []
    for offset, keys in ROWS:
        y = back + (offset + 0.5) * U
        for start, w in keys:
            x = left - (start + w / 2) * U
            caps.append(keycap(f"key_{len(caps)}", w, (x, y, CASE_H + CAP_H / 2 - 0.002), key))
    keys = join("keyboard_keys", caps)
    keys.parent = root

    # rear feet tilt the board; lift it so the front edge rests on the desk
    root.rotation_euler = (-KEYBOARD["tilt"], 0, KEYBOARD["yaw"])
    root.location.z = c.z + (depth / 2) * KEYBOARD["tilt"]

    add_lightmap_uv(case)
    add_lightmap_uv(keys, margin=0.005)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
