"""Snake plant in a concrete pot at the right end of the desk -> floor-plant.glb

Pivot: the pot's bottom centre. Leaves are one mesh with a `_sway` weight per vertex. No leaf is allowed
to lean into the back wall.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from config import FLOOR_PLANT  # noqa: E402
from shared import materials  # noqa: E402
from shared.foliage import add_sway, leaf_mesh  # noqa: E402
from shared.geometry import _apply, add_lightmap_uv, cyl, descendants, empty, join, lathe  # noqa: E402

NAME = "floor_plant"
EXPECT = dict(
    names=["floor_plant_pot", "floor_plant_leaves"],
    bounds=((-1.8, 0.0, FLOOR_PLANT["pos"].z - 0.001), (-0.5, 0.8, FLOOR_PLANT["pos"].z + 0.75)),
    attributes={"floor_plant_leaves": ["_SWAY"]},
    max_tris=8000,
)

LEAVES = 16
WALL_CLEARANCE = 0.03


def build():
    rnd = random.Random(5)
    pos = FLOOR_PLANT["pos"]
    root = empty(NAME, pos)
    r, h = FLOOR_PLANT["pot_radius"], FLOOR_PLANT["pot_height"]
    # a cast concrete planter: straight sides, a flat rim 8 mm thick, soil set 2.5 cm down inside
    wall = 0.008
    profile = [(0.0, 0.0), (r - 0.003, 0.0), (r, 0.003), (r, h - 0.002), (r - 0.002, h), (r - wall + 0.002, h),
               (r - wall, h - 0.002), (r - wall, h - 0.025)]
    body = lathe("pot", profile, materials.get("pot_stone"), segments=56, tile=0.2)
    soil = cyl("soil", r - wall, 0.004, (0, 0, h - 0.027), materials.get("soil"))
    join("floor_plant_pot", [body, soil]).parent = root

    leaf_m = materials.get("snake_leaf")
    leaves = []
    for i in range(LEAVES):
        ang = i / LEAVES * 2 * math.pi * 2.6 + rnd.uniform(-0.3, 0.3)  # spiral round the clump
        r0 = rnd.uniform(0.005, 0.045)
        inner = r0 < 0.025
        # the middle leaves stand tall and straight, the outer ones are shorter and lean out
        length = rnd.uniform(0.40, 0.55) if inner else rnd.uniform(0.28, 0.42)
        width = rnd.uniform(0.026, 0.036)
        lean = math.radians(rnd.uniform(-4, 8) if inner else rnd.uniform(12, 30))
        # keep the tip in front of the back wall: y of the tip = pot y + (r0 + L sin(lean)) sin(ang)
        reach_back = pos.y + (r0 + length * math.sin(lean)) * math.sin(ang)
        if reach_back < WALL_CLEARANCE:
            lean = math.asin(max(-1.0, min(1.0, ((WALL_CLEARANCE - pos.y) / math.sin(ang) - r0) / length)))
        me = leaf_mesh(f"snake_shape_{i}", length, width, "sword", seg_l=18, seg_w=4,
                       droop=rnd.uniform(0.02, 0.06) if inner else rnd.uniform(0.06, 0.14),
                       twist=rnd.uniform(-0.9, 0.9))
        leaf = bpy.data.objects.new(f"snake_leaf_{i}", me)
        bpy.context.collection.objects.link(leaf)
        me.materials.append(leaf_m)
        leaf.location = (math.cos(ang) * r0, math.sin(ang) * r0, h - 0.027)
        # the leaf grows along local +y: tip it up, lean it outward along `ang`, turn its face a little
        leaf.rotation_euler = (math.radians(90) - lean, rnd.uniform(-0.3, 0.3), ang - math.pi / 2)
        leaves.append(leaf)
    merged = join("floor_plant_leaves", leaves)
    merged.parent = root
    # a hair of thickness, so each face of a leaf bakes its own light: a single sheet stores one side's
    # light, and the camera sees many leaves from their other side
    solid = merged.modifiers.new("solidify", "SOLIDIFY")
    solid.thickness = 0.0008
    solid.offset = 0
    _apply(merged, solid)

    bpy.context.view_layer.update()
    add_sway(merged, pos + Vector((0, 0, h)), reach=0.45)
    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o, margin=0.005)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
