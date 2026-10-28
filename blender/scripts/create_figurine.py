"""A small stylised cat figurine on the shelf -> figurine.glb

A generic cat, not a copy of any mascot: oversized round head with pointed ears, a pear-shaped body and
a curled tail. Pivot: bottom centre. It is turned to face the camera.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

from config import CAMERA, FIGURINE, SHELF, SHELF_PROPS  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, assign, descendants, empty, join, sphere, tube  # noqa: E402

NAME = "figurine"
EXPECT = dict(
    names=["figurine", "figurine_body", "figurine_eyes"],
    bounds=((-0.15, 0.0, SHELF["top"] - 0.001), (0.02, SHELF["depth"], SHELF["top"] + 0.13)),
    max_tris=3000,
)


def facing_camera(x, y):
    """Yaw that turns local +y toward the camera."""
    dx, dy = CAMERA["pos"].x - x, CAMERA["pos"].y - y
    return math.atan2(dy, dx) - math.pi / 2


def build():
    x, y = FIGURINE["x"], SHELF_PROPS["figurine_y"]
    root = empty(NAME, (x, y, SHELF["top"]), (0, 0, facing_camera(x, y)))
    ceramic = materials.get("figurine_ceramic")
    s = FIGURINE["height"] / 0.111  # proportions below are for a 0.111 m figure

    parts = [
        sphere("body", 0.030 * s, (0, 0, 0.034 * s), ceramic, scale=(1.0, 0.9, 1.15)),
        sphere("head", 0.029 * s, (0, 0.002 * s, 0.079 * s), ceramic, scale=(1.12, 1.0, 0.95)),
    ]
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(radius1=0.011 * s, radius2=0.0, depth=0.024 * s, vertices=8)
        ear = bpy.context.active_object
        ear.location = (side * 0.019 * s, 0, 0.101 * s)
        ear.rotation_euler = (0, math.radians(side * 14), 0)
        assign(ear, ceramic)
        parts.append(ear)
    parts.append(tube("tail", [(0.022 * s, -0.018 * s, 0.006 * s), (0.040 * s, -0.010 * s, 0.018 * s),
                               (0.044 * s, 0.006 * s, 0.040 * s), (0.034 * s, 0.014 * s, 0.056 * s)],
                      0.005 * s, ceramic, sides=6))
    body = join("figurine_body", parts)
    body.parent = root

    eyes = [sphere(f"eye_{side}", 0.004 * s, (side * 0.011 * s, 0.030 * s, 0.081 * s),
                   materials.get("figurine_eyes"), seg=8, rings=6) for side in (-1, 1)]
    join("figurine_eyes", eyes).parent = root

    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
