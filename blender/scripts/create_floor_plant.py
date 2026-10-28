"""Snake plant in a stone pot at the right end of the desk -> floor-plant.glb

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
from shared.geometry import add_lightmap_uv, cyl, descendants, empty, join  # noqa: E402

NAME = "floor_plant"
EXPECT = dict(
    names=["floor_plant_pot", "floor_plant_leaves"],
    bounds=((-1.8, 0.0, FLOOR_PLANT["pos"].z - 0.001), (-0.5, 0.8, FLOOR_PLANT["pos"].z + 0.75)),
    attributes={"floor_plant_leaves": ["_SWAY"]},
    max_tris=8000,
)

LEAVES = 13
WALL_CLEARANCE = 0.03


def build():
    rnd = random.Random(5)
    pos = FLOOR_PLANT["pos"]
    root = empty(NAME, pos)
    r, h = FLOOR_PLANT["pot_radius"], FLOOR_PLANT["pot_height"]
    stone = materials.get("pot_stone")
    body = cyl("pot", r * 0.92, h - 0.022, (0, 0, (h - 0.022) / 2), stone, bev=0.004)
    rim = cyl("rim", r, 0.024, (0, 0, h - 0.012), stone, bev=0.004)
    soil = cyl("soil", r * 0.88, 0.008, (0, 0, h - 0.008), materials.get("soil"))
    join("floor_plant_pot", [body, rim, soil]).parent = root

    greens = [materials.get("snake_leaf"), materials.get("snake_leaf_dark")]
    leaves = []
    for i in range(LEAVES):
        ang = i / LEAVES * 2 * math.pi + rnd.uniform(-0.2, 0.2)
        length = rnd.uniform(0.32, 0.48)
        width = rnd.uniform(0.042, 0.058)
        lean = math.radians(rnd.uniform(-6, 24))
        r0 = rnd.uniform(0.01, 0.05)
        # keep the tip in front of the back wall: y of the tip = pot y + (r0 + L sin(lean)) sin(ang)
        reach_back = pos.y + (r0 + length * math.sin(lean)) * math.sin(ang)
        if reach_back < WALL_CLEARANCE:
            lean = math.asin(max(-1.0, min(1.0, ((WALL_CLEARANCE - pos.y) / math.sin(ang) - r0) / length)))
        me = leaf_mesh(f"snake_shape_{i}", length, width, "sword", seg_l=14, seg_w=4, droop=0.0,
                       twist=rnd.uniform(-0.6, 0.6))
        leaf = bpy.data.objects.new(f"snake_leaf_{i}", me)
        bpy.context.collection.objects.link(leaf)
        me.materials.append(rnd.choice(greens))
        leaf.location = (math.cos(ang) * r0, math.sin(ang) * r0, h - 0.006)
        # the leaf grows along local +y: tip it up, lean it outward along `ang`
        leaf.rotation_euler = (math.radians(90) - lean, 0, ang - math.pi / 2)
        leaves.append(leaf)
    merged = join("floor_plant_leaves", leaves)
    merged.parent = root

    bpy.context.view_layer.update()
    add_sway(merged, pos + Vector((0, 0, h)), reach=0.45)
    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o, margin=0.005)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
