"""Mesh helpers shared by the create_* scripts."""
import math

import bpy  # must load before bmesh
import bmesh
from mathutils import Vector

LIGHTMAP_UV = "lightmap"


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def empty(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    e.location = loc
    e.rotation_euler = rot
    if parent:
        e.parent = parent
    return e


def assign(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)


def bevel(obj, width, segments=3):
    if width <= 0:
        return
    # The bevel modifier interpolates UVs on several threads, leaving run-to-run float noise; drop them
    # and project fresh ones afterwards so exports stay byte-for-byte reproducible.
    while obj.data.uv_layers:
        obj.data.uv_layers.remove(obj.data.uv_layers[0])
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    _apply(obj, mod)
    _project_uvs(obj, obj.data.uv_layers.new(name="UVMap"))


def box(name, size, loc, m, rot=(0, 0, 0), bev=0.0, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    bevel(o, bev)
    o.location = loc
    o.rotation_euler = rot
    assign(o, m)
    if parent:
        o.parent = parent
    return o


def cyl(name, r, h, loc, m, rot=(0, 0, 0), verts=48, bev=0.0, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    bevel(o, bev)
    o.location = loc
    o.rotation_euler = rot
    assign(o, m)
    _smooth(o)
    if parent:
        o.parent = parent
    return o


def sphere(name, r, loc, m, scale=(1, 1, 1), parent=None, seg=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=rings)
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    o.location = loc
    assign(o, m)
    _smooth(o)
    if parent:
        o.parent = parent
    return o


def rod(name, a, b, r, m, parent=None, verts=16):
    """Cylinder between two points (in the parent's space)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d.length, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    o.location = (a + b) / 2
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    assign(o, m)
    _smooth(o)
    if parent:
        o.parent = parent
    return o


def tube(name, pts, r, m, parent=None, sides=6):
    """A mesh tube along a polyline (curves are converted to mesh so they export and bake like
    everything else)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = max(0, sides // 2 - 2)
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (v[0], v[1], v[2], 1)
    tmp = bpy.data.objects.new(name + "_curve", cu)
    bpy.context.collection.objects.link(tmp)
    mesh = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    mesh.name = name
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    assign(o, m)
    if parent:
        o.parent = parent
    return o


def plane(name, w, h, loc, m, facing="+y", parent=None):
    """A w x h rectangle facing `facing` ("+y" or "-x"), with its geometry already oriented so the
    object itself carries no rotation. UVs run left-to-right, bottom-to-top as seen from the front."""
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    o.scale = (w, h, 1)
    # default plane faces +Z with UV u along +X; turn it to face the viewer
    o.rotation_euler = {"+y": (math.pi / 2, 0, math.pi), "-x": (math.pi / 2, 0, -math.pi / 2)}[facing]
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    o.location = loc
    assign(o, m)
    if parent:
        o.parent = parent
    return o


def join(name, objs):
    """Merge `objs` into the first one, renamed `name`."""
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    o.select_set(False)
    return o


def delete_faces(obj, direction):
    """Remove faces pointing along `direction` (local space): sides no camera pose ever sees, which
    would otherwise take a share of the lightmap atlas."""
    d = Vector(direction).normalized()
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.dot(d) > 0.9], context="FACES")
    bm.to_mesh(obj.data)
    bm.free()


def slice_along(obj, axis, step):
    """Cut the mesh with planes every `step` metres along local `axis` (0=x, 1=y, 2=z). Long faces then
    become near-square islands that pack into a square lightmap without wasting most of it."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    lo = min(v.co[axis] for v in bm.verts)
    hi = max(v.co[axis] for v in bm.verts)
    cuts = max(1, round((hi - lo) / step))
    normal = Vector([1.0 if i == axis else 0.0 for i in range(3)])
    for k in range(1, cuts):
        co = Vector((0, 0, 0))
        co[axis] = lo + (hi - lo) * k / cuts
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=normal)
    bm.to_mesh(obj.data)
    bm.free()


def add_lightmap_uv(obj, margin=0.02):
    """Second UV layer with non-overlapping islands, ready for baking."""
    uvs = obj.data.uv_layers
    if LIGHTMAP_UV not in uvs:
        uvs.new(name=LIGHTMAP_UV)
    _lightmap_pack([obj], margin)


def pack_lightmaps(root, margin=0.004):
    """Repack the lightmap UVs of every mesh under `root` into one shared atlas, so the asset bakes into
    a single image."""
    _lightmap_pack([o for o in descendants(root) if o.type == "MESH" and not o.hide_render], margin)


def _lightmap_pack(objs, margin):
    """Blender's Lightmap Pack, run on meshes in name order. The operator gathers meshes into a Python
    set, whose order follows memory addresses, so identical faces (like the desk's four legs) swap places
    in the atlas from run to run; calling its packer with a sorted list makes the result reproducible."""
    from bl_operators.uvcalc_lightmap import lightmap_uvpack

    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    meshes = sorted({o.data for o in objs}, key=lambda me: me.name)
    for me in meshes:
        me.uv_layers.active = me.uv_layers[LIGHTMAP_UV]
    lightmap_uvpack(meshes, PREF_SEL_ONLY=False, PREF_PACK_IN_ONE=True, PREF_BOX_DIV=12,
                    PREF_MARGIN_DIV=int(1.0 / (margin * 10 / 100.0)))
    for me in meshes:
        me.uv_layers.active = me.uv_layers[0]


def _project_uvs(obj, layer, margin=0.02):
    """Texture UVs for a mesh that lost them (see bevel)."""
    obj.data.uv_layers.active = layer
    _only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(island_margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)


def descendants(root):
    out = [root]
    for c in root.children:
        out += descendants(c)
    return out


def _smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True


def _only(obj):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def _apply(obj, mod):
    _only(obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)
