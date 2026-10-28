"""Eight books standing on the shelf -> books.glb

Each book is its own object (book_0 ... book_7, left to right as seen from the camera) so the site can
move and open them one by one. Pivot: bottom centre of each book. The spine faces the viewer (+y) and
shows column i of the shared spine atlas.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402  (must load before bmesh)
import bmesh  # noqa: E402

from config import BOOK_DEPTH, BOOKS, SHELF, SHELF_PROPS  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, descendants, empty  # noqa: E402
from shared.textures import SPINE_ATLAS, SPINE_COLUMN, spine_column_height  # noqa: E402

NAME = "books"
EXPECT = dict(
    names=[f"book_{i}" for i in range(len(BOOKS))],
    bounds=((-0.05, 0.0, SHELF["top"] - 0.001), (0.45, SHELF["depth"], SHELF["top"] + 0.25)),
    max_tris=500,
)


def book(i, spec, spine, root):
    t, h, d = spec["thickness"], spec["height"], BOOK_DEPTH
    me = bpy.data.meshes.new(f"book_{i}")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(t, d, h), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=bm.verts)
    uv = bm.loops.layers.uv.new("UVMap")
    u0, u1 = i * SPINE_COLUMN / SPINE_ATLAS, (i + 1) * SPINE_COLUMN / SPINE_ATLAS
    v0 = 1 - spine_column_height(t, h) / SPINE_ATLAS
    for f in bm.faces:
        if f.normal.y > 0.9:  # the spine; its left edge (viewer's left) is +x
            f.material_index = 1
            for loop in f.loops:
                c = loop.vert.co
                loop[uv].uv = (u0 if c.x > 0 else u1, v0 if c.z < h / 2 else 1.0)
        else:
            for loop in f.loops:
                loop[uv].uv = (0.0, 0.0)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(f"book_{i}", me)
    bpy.context.collection.objects.link(o)
    me.materials.append(materials.get(f"book_cover_{i}", dict(color=spec["cover"], rough=0.7)))
    me.materials.append(spine)
    o.parent = root
    o.location = (spec["x"], SHELF_PROPS["book_front"] - d / 2, 0)
    return o


def build():
    root = empty(NAME, (0, 0, SHELF["top"]))
    spine = materials.get("book_spine")
    for i, spec in enumerate(BOOKS):
        book(i, spec, spine, root)
    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
