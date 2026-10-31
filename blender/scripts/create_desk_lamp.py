"""Adjustable desk lamp: base, sprung lower arm, upper arm, dish head with an emissive diffuser
-> desk-lamp.glb

Local frame: origin at the centre of the base on the desk (no rotation), so local = world - base.
Nodes the site drives: lamp_diffuser and lamp_bulb (emissive), lamp_light_anchor and lamp_light_target
(where the live light sits and aims), lamp_hit (invisible click target around the head).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402  (must load before bmesh/mathutils)
import bmesh  # noqa: E402
from mathutils import Vector  # noqa: E402

from config import DESK_Z, LAMP  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import (  # noqa: E402
    add_lightmap_uv, assign, box, cyl, descendants, empty, rod, sphere, tube,
)

NAME = "desk_lamp"
EXPECT = dict(
    names=["lamp_base", "lamp_arm_lower", "lamp_arm_upper", "lamp_spring", "lamp_head", "lamp_diffuser",
           "lamp_bulb", "lamp_light_anchor", "lamp_light_target", "lamp_hit"],
    bounds=((-0.4, 0.2, DESK_Z - 0.001), (0.5, 0.8, 1.25)),
    max_tris=10000,
)

BASE_R, BASE_H = 0.085, 0.02
ARM_R = 0.006
DISH_DEPTH = 0.08


def dish_shell(name, radius, depth, m, parent):
    """Half of a squashed sphere, open toward +z, rim in the z=0 plane."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=48, ring_count=24)
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > 1e-4], context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    o.scale = (1, 1, depth / radius)
    bpy.ops.object.transform_apply(scale=True)
    for p in o.data.polygons:
        p.use_smooth = True
    assign(o, m)
    o.parent = parent
    return o


def spring(name, a, b, radius, turns, m, parent):
    axis = b - a
    n = axis.normalized()
    u = n.cross(Vector((0, 1, 0))).normalized()
    v = n.cross(u).normalized()
    steps = turns * 12
    pts = []
    for i in range(steps + 1):
        t = i / steps
        ang = t * turns * 2 * math.pi
        pts.append(a + axis * t + u * math.cos(ang) * radius + v * math.sin(ang) * radius)
    return tube(name, pts, 0.0026, m, parent=parent, sides=6)


def build():
    base = LAMP["base"]
    root = empty(NAME, base)
    metal, dark = materials.get("lamp_metal"), materials.get("lamp_dark")

    def local(p):
        return Vector(p) - base

    cyl("lamp_base", BASE_R, BASE_H, (0, 0, BASE_H / 2), dark, bev=0.004, parent=root)
    cyl("lamp_base_cap", 0.035, 0.012, (0, 0, BASE_H + 0.006), metal, bev=0.002, parent=root)

    j0 = Vector((0, 0, BASE_H + 0.02))
    j1 = local(LAMP["elbow"])
    sphere("lamp_joint_base", 0.012, j0, metal, parent=root)
    rod("lamp_arm_lower", j0, j1, ARM_R, metal, parent=root)
    spring("lamp_spring", j0 + (j1 - j0) * 0.12, j0 + (j1 - j0) * 0.82, 0.012, 14, metal, root)
    sphere("lamp_joint_elbow", 0.016, j1, metal, parent=root)

    n = LAMP["dish_normal"].normalized()
    rim = local(LAMP["head"])
    knuckle = rim - n * (DISH_DEPTH + 0.02)
    rod("lamp_arm_upper", j1, knuckle, ARM_R, metal, parent=root)
    sphere("lamp_joint_head", 0.013, knuckle, metal, parent=root)

    head = empty("lamp_head_pivot", rim, parent=root)
    head.rotation_mode = "QUATERNION"
    head.rotation_quaternion = n.to_track_quat("Z", "Y")
    r = LAMP["dish_diameter"] / 2
    dish_shell("lamp_head", r, DISH_DEPTH, metal, head)
    dish_shell("lamp_diffuser", r - 0.004, DISH_DEPTH - 0.004, materials.get("lamp_shade_inner"), head)
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.004, major_segments=48, minor_segments=8)
    ring = bpy.context.active_object
    ring.name = ring.data.name = "lamp_rim"
    assign(ring, metal)
    ring.parent = head
    sphere("lamp_bulb", 0.016, (0, 0, -0.035), materials.get("lamp_bulb"), parent=head)

    # where the site's live light sits (the bulb) and what it aims at (the measured light pool)
    empty("lamp_light_anchor", rim - n * 0.035, parent=root)
    empty("lamp_light_target", local(LAMP["pool"]), parent=root)
    hit = box("lamp_hit", (2 * r + 0.04, 2 * r + 0.04, DISH_DEPTH + 0.06), (0, 0, -DISH_DEPTH / 2),
              materials.get("proxy"), parent=head)
    hit.hide_render = True

    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


def light_anchor():
    """World position of the bulb and the point it aims at, for the preview/bake lights."""
    n = LAMP["dish_normal"].normalized()
    return LAMP["head"] - n * 0.035, LAMP["pool"]


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
