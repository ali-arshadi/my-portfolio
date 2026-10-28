"""Mesh helpers shared by the create_* scripts."""
import bpy

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
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    _apply(obj, mod)
    _snap_uvs(obj)


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


def add_lightmap_uv(obj, margin=0.02):
    """Second UV layer with non-overlapping islands, ready for baking in Phase 4."""
    uvs = obj.data.uv_layers
    layer = uvs.get(LIGHTMAP_UV) or uvs.new(name=LIGHTMAP_UV)
    uvs.active = layer
    _only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(island_margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")
    uvs.active = uvs[0]


def descendants(root):
    out = [root]
    for c in root.children:
        out += descendants(c)
    return out


def _only(obj):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def _snap_uvs(obj, step=1e-5):
    """The bevel modifier interpolates UVs on several threads, which leaves 1-ULP differences between
    runs. Snapping them keeps the exported GLBs byte-for-byte reproducible."""
    for layer in obj.data.uv_layers:
        for d in layer.data:
            d.uv = (round(d.uv[0] / step) * step, round(d.uv[1] / step) * step)


def _apply(obj, mod):
    _only(obj)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)
