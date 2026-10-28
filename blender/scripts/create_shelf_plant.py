"""Trailing pothos in a white pot at the right end of the shelf -> shelf-plant.glb

Local frame: origin at the pot's bottom centre, +y toward the viewer (the shelf's front edge is
SHELF["depth"] - pot y ahead), +x to the viewer's left. Vines climb out of the pot, run forward over the
shelf's front edge and hang in front of it, past the top-right corner of the monitor as in the reference.
Leaves and vines are one mesh with a `_sway` weight per vertex for the site's animation.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from config import SHELF, SHELF_PLANT, SHELF_PROPS  # noqa: E402
from shared import materials  # noqa: E402
from shared.foliage import add_sway, leaf_mesh  # noqa: E402
from shared.geometry import add_lightmap_uv, cyl, descendants, empty, join, tube  # noqa: E402

NAME = "shelf_plant"
EXPECT = dict(
    names=["shelf_plant_pot", "shelf_plant_leaves"],
    bounds=((-0.7, -0.01, SHELF["top"] - 0.2), (-0.2, 0.4, SHELF["top"] + 0.3)),
    attributes={"shelf_plant_leaves": ["_SWAY"]},
    max_tris=15000,
)

# Vine paths in pot space. The front edge of the shelf is at local y = 0.10; anything below z = 0 is
# in front of it (y > 0.11) or past the shelf's right end (x < -0.086).
VINES = [
    [(0, 0, 0.085), (0.03, 0.04, 0.13), (0.06, 0.09, 0.12), (0.08, 0.12, 0.05), (0.09, 0.125, -0.03),
     (0.10, 0.13, -0.12)],
    [(0, 0, 0.085), (-0.03, 0.05, 0.13), (-0.07, 0.09, 0.11), (-0.10, 0.12, 0.04), (-0.11, 0.13, -0.05),
     (-0.12, 0.14, -0.13)],
    [(0, 0, 0.085), (-0.05, 0.0, 0.14), (-0.11, 0.02, 0.12), (-0.16, 0.05, 0.08), (-0.20, 0.06, -0.04),
     (-0.21, 0.07, -0.12)],
    [(0, 0, 0.085), (0.0, -0.02, 0.16), (0.02, -0.03, 0.21), (0.05, -0.02, 0.23)],
    [(0, 0, 0.085), (0.04, 0.0, 0.15), (0.09, 0.01, 0.18), (0.14, 0.03, 0.15)],
]


def build():
    rnd = random.Random(11)
    root = empty(NAME, (SHELF_PLANT["x"], SHELF_PROPS["shelf_plant_pot_y"], SHELF["top"]))
    r, h = SHELF_PLANT["pot_radius"], SHELF_PLANT["pot_height"]
    pot = cyl("pot", r, h, (0, 0, h / 2), materials.get("pot_ceramic"), bev=0.003)
    soil = cyl("soil", r - 0.005, 0.006, (0, 0, h - 0.006), materials.get("soil"))
    join("shelf_plant_pot", [pot, soil]).parent = root

    # small, dense leaves: the reference reads as a full bush, not a few large leaves
    shapes = [leaf_mesh(f"pothos_shape_{i}", 0.04 + 0.009 * i, 0.022 + 0.003 * i, "heart") for i in range(3)]
    greens = [materials.get("pothos_leaf"), materials.get("pothos_leaf_dark")]
    parts = []
    for vi, pts in enumerate(VINES):
        parts.append(tube(f"vine_{vi}", pts, 0.0015, materials.get("pothos_stem"), sides=4))
        for k in range(1, len(pts)):
            a, b = Vector(pts[k - 1]), Vector(pts[k])
            for q in range(3):
                leaf = bpy.data.objects.new(f"leaf_{vi}_{k}_{q}", rnd.choice(shapes).copy())
                bpy.context.collection.objects.link(leaf)
                leaf.data.materials.append(rnd.choice(greens))
                p = a.lerp(b, 0.15 + 0.3 * q)
                leaf.location = p + Vector((rnd.uniform(-0.004, 0.004), rnd.uniform(-0.004, 0.004), 0))
                # hanging leaves point down, the ones up in the bush fan outward
                tilt = rnd.uniform(110, 160) if p.z < 0.1 else rnd.uniform(40, 95)
                leaf.rotation_euler = (math.radians(tilt), 0, rnd.uniform(0, 2 * math.pi))
                leaf.scale = (rnd.uniform(0.8, 1.15),) * 3
                parts.append(leaf)
    leaves = join("shelf_plant_leaves", parts)
    leaves.parent = root
    for shape in shapes:
        bpy.data.meshes.remove(shape)

    bpy.context.view_layer.update()
    add_sway(leaves, root.matrix_world @ Vector((0, 0, h)), reach=0.25)
    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o, margin=0.005)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
