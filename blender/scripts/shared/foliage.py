"""Leaf meshes and the per-vertex sway weight used by the site's plant animation."""
import math

import bpy  # must load before bmesh/mathutils
import bmesh

SWAY = "_sway"  # glTF exports custom attributes whose names start with "_"


def leaf_mesh(name, length, width, kind="heart", seg_l=10, seg_w=6, droop=0.25, twist=0.0):
    """A leaf growing along +y from the origin. "heart" is a pothos leaf, "sword" a snake-plant leaf."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    grid = []
    for i in range(seg_l + 1):
        t = i / seg_l
        if kind == "heart":
            wt = width * (math.sin(math.pi * min(1.0, t * 1.05) ** 0.85) ** 0.75)
            lobe = 1.0 if t > 0.12 else (0.3 + 0.7 * t / 0.12)  # the notch near the stem
        else:
            wt = width * (math.sin(math.pi * min(1.0, t ** 0.55)) ** 0.6)
            lobe = 1.0
        row = []
        for j in range(seg_w + 1):
            s = (j / seg_w) * 2 - 1
            x = s * wt * lobe
            y = t * length - (abs(s) * wt * 0.35 if kind == "heart" and t < 0.35 else 0)
            fold = abs(s) * wt * 0.22  # a shallow V along the midrib
            z = fold - droop * length * (t ** 2) * 0.5
            ang = twist * t
            row.append(bm.verts.new((x * math.cos(ang) - z * math.sin(ang), y, x * math.sin(ang) + z * math.cos(ang))))
        grid.append(row)
    for i in range(seg_l):
        for j in range(seg_w):
            bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for loop in f.loops:
            v = loop.vert.co
            loop[uv].uv = (v.x / (width * 2 + 1e-6) + 0.5, v.y / (length + 1e-6))
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return me


def add_sway(obj, origin, reach):
    """Sway weight per vertex: 0 at `origin` (where the plant is anchored), rising to 1 at `reach`
    metres away. The site's vertex shader scales its motion by it, so the pot and stems stay put."""
    attr = obj.data.attributes.get(SWAY) or obj.data.attributes.new(SWAY, "FLOAT", "POINT")
    m = obj.matrix_world
    for v, d in zip(obj.data.vertices, attr.data):
        dist = ((m @ v.co) - origin).length
        d.value = round(min(1.0, dist / reach) ** 1.5, 4)
