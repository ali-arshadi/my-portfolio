"""Checks run on every asset before and after export. They raise on the first failure."""
import bpy
from mathutils import Vector

from .export import glb_json
from .geometry import LIGHTMAP_UV, descendants


class AssetError(Exception):
    pass


def world_bounds(root):
    pts = [o.matrix_world @ Vector(c) for o in descendants(root) if o.type == "MESH" for c in o.bound_box]
    if not pts:
        raise AssetError(f"{root.name}: no meshes")
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def triangles(root):
    return sum(
        sum(len(p.vertices) - 2 for p in o.data.polygons)
        for o in descendants(root) if o.type == "MESH"
    )


def check_scene(root, expect):
    """`expect`: dict(names=[...], bounds=((lo), (hi)), max_tris=int)."""
    have = {o.name for o in descendants(root)}
    missing = [n for n in expect.get("names", []) if n not in have]
    if missing:
        raise AssetError(f"{root.name}: missing objects {missing}")

    lo, hi = world_bounds(root)
    if "bounds" in expect:
        elo, ehi = (Vector(v) for v in expect["bounds"])
        if any(lo[i] < elo[i] - 1e-4 or hi[i] > ehi[i] + 1e-4 for i in range(3)):
            raise AssetError(f"{root.name}: bounds {tuple(lo)}..{tuple(hi)} outside {tuple(elo)}..{tuple(ehi)}")

    tris = triangles(root)
    if tris > expect.get("max_tris", 10**9):
        raise AssetError(f"{root.name}: {tris} triangles > budget {expect['max_tris']}")

    for o in descendants(root):
        if o.type != "MESH":
            continue
        if not o.data.materials:
            raise AssetError(f"{o.name}: no material")
        if LIGHTMAP_UV not in o.data.uv_layers:
            raise AssetError(f"{o.name}: no '{LIGHTMAP_UV}' UV layer")
    return dict(tris=tris, bounds=(tuple(round(v, 3) for v in lo), tuple(round(v, 3) for v in hi)))


def check_glb(path, names, attributes=None):
    """The exported file parses and still contains the named nodes, meshes, materials and both UV sets,
    plus any extra vertex `attributes` ({mesh name: [attribute, ...]})."""
    j = glb_json(path)
    nodes = {n.get("name") for n in j.get("nodes", [])}
    missing = [n for n in names if n not in nodes]
    if missing:
        raise AssetError(f"{path}: missing nodes {missing}")
    if not j.get("materials"):
        raise AssetError(f"{path}: no materials")
    for mesh in j.get("meshes", []):
        for prim in mesh["primitives"]:
            if "TEXCOORD_1" not in prim["attributes"]:
                raise AssetError(f"{path}: mesh {mesh.get('name')} lost its lightmap UVs")
            for attr in (attributes or {}).get(mesh.get("name"), []):
                if attr not in prim["attributes"]:
                    raise AssetError(f"{path}: mesh {mesh.get('name')} has no {attr} attribute")
    return dict(nodes=len(nodes), meshes=len(j.get("meshes", [])))


def assert_no_orphans():
    """Every mesh object belongs to an asset root (has a parent)."""
    loose = [o.name for o in bpy.data.objects if o.type == "MESH" and o.parent is None]
    if loose:
        raise AssetError(f"objects outside any asset: {loose}")
