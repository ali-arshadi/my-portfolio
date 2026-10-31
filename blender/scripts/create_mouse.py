"""A wireless mouse just right of the keyboard -> mouse.glb

Not in the reference: added by the owner. A satin-black shell, wider and higher toward the back where the
palm rests, flat underneath, with a rubber scroll wheel between the buttons.

Local frame: origin at the centre of the mouse's footprint on the desk, +y toward the viewer (the palm
end), the buttons toward -y.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

from config import DESK_Z, MOUSE  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, assign, cyl, descendants, empty  # noqa: E402

NAME = "mouse"
EXPECT = dict(
    names=["mouse_body", "mouse_wheel"],
    bounds=((-0.82, 0.64, DESK_Z - 0.001), (-0.66, 0.81, DESK_Z + 0.05)),
    max_tris=4000,
)

HALF_W, HALF_L, HEIGHT = 0.031, 0.058, 0.036
FOOT = 0.003  # the flat underside sits on its feet, this far above the desk


def crown(yn):
    """Shell height along the mouse (yn: -1 at the buttons' tips, 1 at the palm end): highest a little
    behind the middle, where the palm sits."""
    return HEIGHT * math.exp(-((yn - 0.25) / 0.85) ** 2)


def body():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=40, ring_count=24)
    o = bpy.context.active_object
    o.name = o.data.name = "mouse_body"
    for v in o.data.vertices:
        x, y, z = v.co
        # wider at the palm end than at the buttons
        v.co.x = x * HALF_W * (1 + 0.1 * y)
        v.co.y = y * HALF_L
        v.co.z = FOOT + (z * crown(y) if z > 0 else z * 0.003)
    for p in o.data.polygons:
        p.use_smooth = True
    assign(o, materials.get("mouse_shell"))
    return o


def build():
    root = empty(NAME, MOUSE["pos"], (0, 0, MOUSE["yaw"]))
    body().parent = root
    # the wheel stands just proud of the shell, a third of the way back from the buttons' tips
    yn = -0.45
    cyl("mouse_wheel", 0.0095, 0.007, (0, yn * HALF_L, FOOT + crown(yn) - 0.007), materials.get("mouse_wheel"),
        rot=(0, math.radians(90), 0), verts=24, parent=root)
    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
