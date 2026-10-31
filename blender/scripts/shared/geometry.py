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


def lathe(name, profile, m, loc=(0, 0, 0), segments=48, tile=None, parent=None):
    """A surface of revolution around local z from `profile`, a list of (radius, z) points in order
    (e.g. outside up, over the lip, inside down). Smooth-shaded, with UVs: u around, v along the
    profile by length, both 0-1, or, with `tile`, both in units of `tile` metres so a repeating texture
    keeps its real scale."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        ring = []
        for k in range(segments):
            a = 2 * math.pi * k / segments
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    lengths = [0.0]
    for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
        lengths.append(lengths[-1] + math.hypot(r1 - r0, z1 - z0))
    if tile:
        su, sv = 2 * math.pi * max(r for r, _ in profile) / tile, lengths[-1] / tile
    else:
        su, sv = 1.0, 1.0
    uv = bm.loops.layers.uv.new("UVMap")
    for i in range(len(rings) - 1):
        for k in range(segments):
            k1 = (k + 1) % segments
            f = bm.faces.new((rings[i][k], rings[i][k1], rings[i + 1][k1], rings[i + 1][k]))
            for loop, (kk, ii) in zip(f.loops, ((k, i), (k + 1, i), (k + 1, i + 1), (k, i + 1))):
                loop[uv].uv = (su * kk / segments, sv * lengths[ii] / lengths[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = loc
    assign(o, m)
    _smooth(o)
    if parent:
        o.parent = parent
    return o


def planar_uv(obj, axes, tile):
    """Texture UVs projected from local coordinates: u, v = co[axes[0]], co[axes[1]] / `tile` metres, so
    a repeating texture keeps its real scale however big the surface is."""
    me = obj.data
    uv = me.uv_layers[0]
    for loop in me.loops:
        co = me.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = (co[axes[0]] / tile, co[axes[1]] / tile)


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
    in the atlas from run to run; calling its packer with a sorted list makes the result reproducible.

    Lightmap Pack gives every face its own island. On the plants' smooth pots and leaves that shows as a
    seam at every face, because neighbouring faces bake and filter separately; an asset whose meshes are
    all smooth-shaded gets connected islands from Smart UV Project instead, packed at an even texel
    density. Assets with flat or many small parts (the lamp's spring and joints would split into hundreds
    of islands that the packer's margins shrink to dots) keep Lightmap Pack."""
    from bl_operators.uvcalc_lightmap import lightmap_uvpack

    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    meshes = sorted({o.data for o in objs}, key=lambda me: me.name)
    for me in meshes:
        me.uv_layers.active = me.uv_layers[LIGHTMAP_UV]
    if all(_mostly_smooth(me) for me in meshes):
        owner = {}
        for o in sorted(objs, key=lambda o: o.name):
            owner.setdefault(o.data, o)
        _edit([owner[me] for me in meshes])
        bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0, scale_to_bounds=False)
        bpy.ops.uv.average_islands_scale()
        bpy.ops.uv.pack_islands(rotate=True, margin_method="FRACTION", margin=max(margin, 0.008))
        bpy.ops.object.mode_set(mode="OBJECT")
        for o in bpy.context.selected_objects:
            o.select_set(False)
    else:
        lightmap_uvpack(meshes, PREF_SEL_ONLY=False, PREF_PACK_IN_ONE=True, PREF_BOX_DIV=12,
                        PREF_MARGIN_DIV=int(1.0 / (margin * 10 / 100.0)))
    for me in meshes:
        me.uv_layers.active = me.uv_layers[0]


def _mostly_smooth(me):
    return sum(p.use_smooth for p in me.polygons) > len(me.polygons) / 2


def _edit(objs):
    """Edit mode on `objs` together, every face selected."""
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    # with select sync on, the selected faces' UVs count as selected for the UV operators
    bpy.context.scene.tool_settings.use_uv_select_sync = True
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")


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
