"""A small vinyl cat figurine on the shelf -> figurine.glb

Modelled on the reference's collectible: a wide head with rounded cat ears, a lighter face mask with two
small dark eyes, and a small body with arms and stubby feet, in satin black vinyl. It is a generic cat
figure, not a copy of any brand's mascot. Pivot: bottom centre. It is turned to face the camera.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

from config import CAMERA, FIGURINE, SHELF, SHELF_PROPS  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, assign, descendants, empty, join, rod, sphere  # noqa: E402

NAME = "figurine"
EXPECT = dict(
    names=["figurine", "figurine_body", "figurine_face", "figurine_eyes"],
    bounds=((-0.15, 0.0, SHELF["top"] - 0.001), (0.02, SHELF["depth"], SHELF["top"] + 0.13)),
    max_tris=6000,
)


def facing_camera(x, y):
    """Yaw that turns local +y toward the camera."""
    dx, dy = CAMERA["pos"].x - x, CAMERA["pos"].y - y
    return math.atan2(dy, dx) - math.pi / 2


def ear(side, s, m):
    """A rounded cat ear: a cone with its tip softened, leaning outward."""
    bpy.ops.mesh.primitive_cone_add(radius1=0.0155 * s, radius2=0.0025 * s, depth=0.028 * s, vertices=16)
    o = bpy.context.active_object
    o.location = (side * 0.027 * s, -0.003 * s, 0.097 * s)
    o.rotation_euler = (math.radians(-6), math.radians(side * 16), 0)
    assign(o, m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def build():
    x, y = FIGURINE["x"], SHELF_PROPS["figurine_y"]
    root = empty(NAME, (x, y, SHELF["top"]), (0, 0, facing_camera(x, y)))
    vinyl = materials.get("figurine_vinyl")
    s = FIGURINE["height"] / 0.111  # proportions below are for a 0.111 m figure

    parts = [
        # head: wide and a little flattened, the figure's biggest part
        sphere("head", 0.034 * s, (0, 0, 0.074 * s), vinyl, scale=(1.15, 0.9, 0.85), seg=40, rings=20),
        sphere("body", 0.021 * s, (0, 0, 0.029 * s), vinyl, scale=(1.05, 0.9, 1.15), seg=32, rings=16),
        ear(-1, s, vinyl),
        ear(1, s, vinyl),
    ]
    for side in (-1, 1):
        shoulder, hand = (side * 0.019 * s, 0.002 * s, 0.045 * s), (side * 0.025 * s, 0.008 * s, 0.021 * s)
        parts.append(rod(f"arm_{side}", shoulder, hand, 0.0062 * s, vinyl))
        parts.append(sphere(f"hand_{side}", 0.0068 * s, hand, vinyl, seg=16, rings=8))
        parts.append(sphere(f"foot_{side}", 0.010 * s, (side * 0.011 * s, 0.006 * s, 0.006 * s), vinyl,
                            scale=(1.0, 1.35, 0.6), seg=20, rings=10))
    join("figurine_body", parts).parent = root

    # the lighter face mask, standing just proud of the head's front
    join("figurine_face", [sphere("face", 0.026 * s, (0, 0.0215 * s, 0.07 * s), materials.get("figurine_face"),
                                  scale=(1.12, 0.45, 0.72), seg=32, rings=16)]).parent = root
    eyes = [sphere(f"eye_{side}", 0.0045 * s, (side * 0.0105 * s, 0.0328 * s, 0.072 * s),
                   materials.get("figurine_eyes"), scale=(0.85, 0.45, 1.15), seg=12, rings=8) for side in (-1, 1)]
    join("figurine_eyes", eyes).parent = root

    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
