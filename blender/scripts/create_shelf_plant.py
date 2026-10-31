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
from mathutils import Quaternion, Vector  # noqa: E402

from config import SHELF, SHELF_PLANT, SHELF_PROPS  # noqa: E402
from shared import materials  # noqa: E402
from shared.foliage import add_sway, leaf_mesh  # noqa: E402
from shared.geometry import add_lightmap_uv, cyl, descendants, empty, join, lathe, tube  # noqa: E402

NAME = "shelf_plant"
EXPECT = dict(
    names=["shelf_plant_pot", "shelf_plant_leaves"],
    bounds=((-0.7, -0.01, SHELF["top"] - 0.2), (-0.2, 0.4, SHELF["top"] + 0.3)),
    attributes={"shelf_plant_leaves": ["_SWAY"]},
    max_tris=30000,
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


def pot_profile(r, h):
    """A glazed planter: tapered body, a rolled lip, and the inside wall down to the soil."""
    return [(0.0, 0.0), (0.80 * r, 0.0), (0.84 * r, 0.004), (0.97 * r, h - 0.012), (r + 0.003, h - 0.006),
            (r + 0.003, h - 0.001), (r - 0.002, h + 0.001), (r - 0.006, h - 0.004), (r - 0.008, h - 0.016)]


def place_leaf(name, shape, base, direction, roll, size, m):
    """A leaf whose stem end sits at `base`, growing along `direction`, its face turned by `roll`."""
    leaf = bpy.data.objects.new(name, shape.copy())
    bpy.context.collection.objects.link(leaf)
    leaf.data.materials.append(m)
    leaf.location = base
    leaf.rotation_mode = "QUATERNION"
    q = direction.to_track_quat("Y", "Z")
    leaf.rotation_quaternion = q @ Quaternion((0, 1, 0), roll)
    leaf.scale = (size,) * 3
    return leaf


def build():
    rnd = random.Random(11)
    root = empty(NAME, (SHELF_PLANT["x"], SHELF_PROPS["shelf_plant_pot_y"], SHELF["top"]))
    r, h = SHELF_PLANT["pot_radius"], SHELF_PLANT["pot_height"]
    pot = lathe("pot", pot_profile(r, h), materials.get("pot_ceramic"), segments=40)
    soil = cyl("soil", r - 0.008, 0.004, (0, 0, h - 0.016), materials.get("soil"))
    join("shelf_plant_pot", [pot, soil]).parent = root

    shapes = [leaf_mesh(f"pothos_shape_{i}", 0.045 + 0.01 * i, 0.026 + 0.004 * i, "heart", droop=0.2)
              for i in range(3)]
    leaf_m, stem_m = materials.get("pothos_leaf"), materials.get("pothos_stem")
    top = Vector((0, 0, h - 0.01))
    parts = []

    # the mound: leaves on short petioles fanning up and out of the pot, the reference's full bush
    for k in range(34):
        az = rnd.uniform(0, 2 * math.pi)
        el = math.radians(rnd.uniform(10, 70))
        d = Vector((math.cos(az) * math.cos(el), math.sin(az) * math.cos(el), math.sin(el)))
        base = top + d * rnd.uniform(0.02, 0.07) + Vector((0, 0, rnd.uniform(0.0, 0.03)))
        parts.append(tube(f"petiole_{k}", [top + Vector((rnd.uniform(-0.01, 0.01), rnd.uniform(-0.01, 0.01), 0)),
                                           base], 0.0012, stem_m, sides=4))
        # leaves face up and out; their tips droop past horizontal
        grow = (d + Vector((0, 0, -0.35))).normalized()
        parts.append(place_leaf(f"mound_{k}", rnd.choice(shapes), base, grow, rnd.uniform(-0.6, 0.6),
                                rnd.uniform(0.8, 1.2), leaf_m))

    # trailing vines: a leaf every few centimetres, alternating sides, hanging tip-down
    for vi, pts in enumerate(VINES):
        parts.append(tube(f"vine_{vi}", pts, 0.0016, stem_m, sides=4))
        side = 1
        for k in range(1, len(pts)):
            a, b = Vector(pts[k - 1]), Vector(pts[k])
            n = max(1, round((b - a).length / 0.032))
            for q in range(n):
                p = a.lerp(b, (q + 0.5) / n)
                along = (b - a).normalized()
                out = along.cross(Vector((0, 0, 1)))
                out = out.normalized() if out.length > 1e-6 else Vector((1, 0, 0))
                hanging = p.z < 0.1
                grow = (out * side * 0.8 + Vector((0, 0.3, -1.0 if hanging else 0.4))).normalized()
                parts.append(place_leaf(f"leaf_{vi}_{k}_{q}", rnd.choice(shapes), p + out * side * 0.004, grow,
                                        rnd.uniform(-0.5, 0.5), rnd.uniform(0.7, 1.05), leaf_m))
                side = -side
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
