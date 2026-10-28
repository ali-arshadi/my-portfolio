"""Moonlit developer desk, built procedurally in Blender (bpy).

    python -I scene.py --out preview.png --res 960x540 --samples 32 --save scene.blend

Coordinates are metres, Z up. The back wall is the plane y=0 (room interior is y>0),
the left wall is the plane x=LEFT_WALL_X (room interior is x>LEFT_WALL_X).
"""
import argparse
import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "tex")

# ------------------------------------------------------------ layout knobs --
LEFT_WALL_X = 1.4
DESK_Z = 0.76
YAW = math.radians(4.9)  # monitor + keyboard rotation (positive = facing toward -x)

CAM_POS = Vector((-1.546, 1.867, 1.466))
CAM_PSI = math.radians(310.3)
CAM_PHI = math.radians(10.3)
CAM_TARGET = CAM_POS + 3 * Vector((math.cos(CAM_PHI) * math.cos(CAM_PSI), math.cos(CAM_PHI) * math.sin(CAM_PSI), -math.sin(CAM_PHI)))
CAM_LENS = 33.6

MON_POS = Vector((-0.467, 0.472, DESK_Z))
KEY_POS = Vector((-0.40, 0.67, DESK_Z))
LAMP_POS = Vector((0.707, 0.21, DESK_Z))
SHELF = dict(x0=-0.412, x1=0.689, y=0.2, z=1.4655)
FRAME_CENTER = Vector((LEFT_WALL_X, 0.32, 1.356))
SNAKE_POS = Vector((-1.06, 0.13, DESK_Z))


# ---------------------------------------------------------------- helpers ---
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def srgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def lin(c):
    """sRGB 0-1 tuple -> linear."""
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)


def mat(name, color=(0.5, 0.5, 0.5), rough=0.5, metal=0.0, emit=None, emit_strength=0.0,
        image=None, image_emit=0.0, coat=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color[:3], 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if coat:
        bsdf.inputs["Coat Weight"].default_value = coat
    if emit is not None:
        bsdf.inputs["Emission Color"].default_value = (*emit[:3], 1)
        bsdf.inputs["Emission Strength"].default_value = emit_strength
    if image:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(os.path.join(TEX, image), check_existing=True)
        tex.image.colorspace_settings.name = "sRGB"
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if image_emit:
            nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
            bsdf.inputs["Emission Strength"].default_value = image_emit
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
    return m


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
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)


def box(name, size, loc, m, rot=(0, 0, 0), bev=0.0, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    bevel(o, bev)
    o.location = loc
    o.rotation_euler = rot
    assign(o, m)
    if parent:
        o.parent = parent
    return o


def cyl(name, r, h, loc, m, rot=(0, 0, 0), verts=48, bev=0.0, parent=None, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    bevel(o, bev)
    o.location = loc
    o.rotation_euler = rot
    assign(o, m)
    if smooth:
        bpy.ops.object.shade_smooth()
    if parent:
        o.parent = parent
    return o


def sphere(name, r, loc, m, scale=(1, 1, 1), parent=None, seg=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=rings)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.location = loc
    assign(o, m)
    bpy.ops.object.shade_smooth()
    if parent:
        o.parent = parent
    return o


def empty(name, loc=(0, 0, 0), rot=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    e.location = loc
    e.rotation_euler = rot
    return e


def plane(name, w, h, loc, rot, m, parent=None):
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    o.location = loc
    o.rotation_euler = rot
    assign(o, m)
    if parent:
        o.parent = parent
    return o


def rod(name, a, b, r, m, parent=None):
    """Cylinder between two points."""
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d.length, vertices=16)
    o = bpy.context.active_object
    o.name = name
    o.location = (a + b) / 2
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    assign(o, m)
    bpy.ops.object.shade_smooth()
    if parent:
        o.parent = parent
    return o


def curve_tube(name, pts, r, m, parent=None, res=6):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.resolution_u = res
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (v[0], v[1], v[2], 1)
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    if parent:
        o.parent = parent
    return o


# -------------------------------------------------------------------- room --
def build_room():
    wall = mat("wall", lin(srgb("#2b2c33")), rough=0.95)
    floor = mat("floor", lin(srgb("#15161b")), rough=0.85)
    box("floor", (6, 5, 0.05), (-0.5, 2.5, -0.025), floor)
    box("back_wall", (4.7, 0.1, 2.5), (-0.85, -0.05, 1.25), wall)
    box("left_wall", (0.1, 2.8, 2.5), (LEFT_WALL_X + 0.05, 1.4, 1.25), wall)

    desk_top = mat("desk_top", lin(srgb("#1f1b18")), rough=0.75)
    box("desk_top", (3.9, 0.85, 0.04), (-0.55, 0.425, DESK_Z - 0.02), desk_top, bev=0.004)
    leg = mat("desk_leg", lin(srgb("#0d0d10")), rough=0.5, metal=0.6)
    for i, (x, y) in enumerate([(1.3, 0.1), (1.3, 0.75), (-2.35, 0.1), (-2.35, 0.75)]):
        box(f"desk_leg_{i}", (0.04, 0.04, DESK_Z - 0.04), (x, y, (DESK_Z - 0.04) / 2), leg)


# ----------------------------------------------------------------- monitor --
def build_monitor():
    root = empty("monitor_root", MON_POS, (0, 0, YAW))
    plastic = mat("monitor_plastic", lin(srgb("#07080b")), rough=0.55, metal=0.1)
    zc = 0.46  # panel centre above desk
    box("monitor_panel", (0.66, 0.022, 0.385), (0, 0, zc), plastic, bev=0.004, parent=root)
    box("monitor_back", (0.40, 0.04, 0.22), (0, -0.03, zc), plastic, bev=0.01, parent=root)
    # neck runs from the base up into the back housing, with a hinge block where they meet
    box("monitor_neck", (0.055, 0.02, 0.39), (0, -0.058, 0.012 + 0.195), plastic, bev=0.003, parent=root)
    box("monitor_hinge", (0.09, 0.03, 0.06), (0, -0.055, 0.40), plastic, bev=0.006, parent=root)
    box("monitor_base", (0.30, 0.20, 0.012), (0, -0.04, 0.006), plastic, bev=0.005, parent=root)
    screen = mat("monitor_screen", (0.02, 0.02, 0.03), rough=0.3, image="screen.png", image_emit=0.2)
    s = plane("Screen", 0.64, 0.36, (0, 0.0115, zc), (math.pi / 2, 0, 0), screen, parent=root)
    # nudge UV so image is not mirrored: plane default UV is fine with rot X +90 (faces -y), so flip
    s.rotation_euler = (math.pi / 2, 0, math.pi)
    s.location = (0, 0.0115, zc)
    return root


# ---------------------------------------------------------------- keyboard --
# 75% layout, widths in key units; the last row ends in the arrow cluster
KB_ROWS = [
    [1] * 15,
    [1] * 13 + [2],
    [1.5] + [1] * 12 + [1.5],
    [1.75] + [1] * 11 + [2.25],
    [2.25] + [1] * 10 + [1.75, 1],
    [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1, 1],
]
KB_U = 0.0205  # key pitch
KB_GAP = 0.0032  # space between neighbouring caps
KB_MARGIN = 0.011  # case border around the key block


def build_keyboard():
    root = empty("keyboard_root", KEY_POS, (0, 0, YAW))
    case = mat("kb_case", lin(srgb("#15161b")), rough=0.45, metal=0.5)
    key = mat("kb_key", lin(srgb("#0b0b0f")), rough=0.42)

    cols = sum(KB_ROWS[0])
    width = cols * KB_U + 2 * KB_MARGIN
    depth = (len(KB_ROWS) + 0.25) * KB_U + 2 * KB_MARGIN
    box("kb_case", (width, depth, 0.018), (0, 0, 0.009), case, bev=0.004, parent=root)

    # one mesh per cap width, so the bevel is not stretched on wide keys
    meshes = {}

    def cap_mesh(w):
        if w not in meshes:
            bpy.ops.mesh.primitive_cube_add(size=1)
            proto = bpy.context.active_object
            proto.scale = (w * KB_U - KB_GAP, KB_U - KB_GAP, 0.008)
            bpy.ops.object.transform_apply(scale=True)
            bevel(proto, 0.0016, 2)
            assign(proto, key)
            meshes[w] = proto.data
            bpy.data.objects.remove(proto)
        return meshes[w]

    n = 0
    top = depth / 2 - KB_MARGIN
    for r, row in enumerate(KB_ROWS):
        # the function row sits a quarter key apart from the rest
        y = top - (r + 0.5 + (0.25 if r else 0)) * KB_U
        x = -cols * KB_U / 2
        for w in row:
            ob = bpy.data.objects.new(f"key_{n}", cap_mesh(w))
            bpy.context.collection.objects.link(ob)
            ob.parent = root
            ob.location = (x + w * KB_U / 2, y, 0.022)
            x += w * KB_U
            n += 1

    # rear feet tilt the board; lift it so the front edge rests on the desk
    tilt = math.radians(-3)
    root.location.z = DESK_Z + math.sin(-tilt) * depth / 2
    root.rotation_euler = (tilt, 0, YAW)
    return root


# -------------------------------------------------------------------- lamp --
def build_lamp():
    root = empty("lamp_root", LAMP_POS, (0, 0, math.radians(0)))
    root.scale = (1.2, 1.2, 1.2)
    bronze = mat("lamp_bronze", lin(srgb("#7a5c3c")), rough=0.38, metal=0.55)
    dark = mat("lamp_dark", lin(srgb("#26221e")), rough=0.45, metal=0.5)
    cyl("lamp_base", 0.09, 0.018, (0, 0, 0.009), dark, bev=0.004, parent=root)
    cyl("lamp_base_top", 0.05, 0.014, (0, 0, 0.025), bronze, parent=root)
    j0 = Vector((0, 0, 0.03))
    j1 = Vector((0.10, 0, 0.20))
    j2 = Vector((0.075, 0, 0.285))
    rod("lamp_arm1", j0, j1, 0.006, bronze, parent=root)
    sphere("lamp_joint1", 0.019, j1, bronze, parent=root)
    rod("lamp_arm2", j1, j2, 0.006, bronze, parent=root)
    # spring around the lower part of arm1
    a_, b_ = j0 + (j1 - j0) * 0.12, j0 + (j1 - j0) * 0.85
    axis = (b_ - a_)
    n = axis.normalized()
    u = n.cross(Vector((0, 1, 0))).normalized()
    v = n.cross(u).normalized()
    pts = []
    turns = 15
    for i in range(turns * 14 + 1):
        t = i / (turns * 14)
        ang = t * turns * 2 * math.pi
        pts.append(a_ + axis * t + u * math.cos(ang) * 0.014 + v * math.sin(ang) * 0.014)
    curve_tube("lamp_spring", pts, 0.0019, bronze, parent=root, res=2)
    # dish: open side faces d (lamp-local coords)
    d = Vector((-0.9, -0.3, 0.3)).normalized()
    head = empty("lamp_head", j2 + d * 0.07, (0, 0, 0))
    head.parent = root
    head.rotation_mode = "QUATERNION"
    head.rotation_quaternion = d.to_track_quat("Z", "Y")
    sphere("lamp_ball", 0.016, (0, 0, -0.07), bronze, parent=head)
    shell_out = mat("lamp_shell_out", lin(srgb("#6a4e32")), rough=0.35, metal=0.55)
    shell_in = mat("lamp_shell_in", lin(srgb("#ff7a22")), rough=0.5, emit=lin(srgb("#ff5a0a")),
                   emit_strength=2.6)
    for name, r, m in (("lamp_shade_out", 0.145, shell_out), ("lamp_shade_in", 0.139, shell_in)):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=64, ring_count=32)
        o = bpy.context.active_object
        o.name = name
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bm.verts.ensure_lookup_table()
        kill = [vv for vv in bm.verts if vv.co.z > 0.0005]  # open side towards +Z
        bmesh.ops.delete(bm, geom=kill, context="VERTS")
        bm.to_mesh(o.data)
        bm.free()
        o.scale = (1, 1, 0.48)
        assign(o, m)
        bpy.ops.object.shade_smooth()
        o.parent = head
    bpy.ops.mesh.primitive_torus_add(major_radius=0.1425, minor_radius=0.0045, major_segments=64, minor_segments=12)
    rim = bpy.context.active_object
    rim.name = "lamp_rim"
    assign(rim, bronze)
    bpy.ops.object.shade_smooth()
    rim.parent = head
    bulb = mat("lamp_bulb", (1, 0.7, 0.4), emit=lin(srgb("#ffc27a")), emit_strength=6, rough=0.3)
    sphere("lamp_bulb", 0.03, (0, 0, -0.03), bulb, parent=head)
    # the real light is aimed independently at the desk pool, in world space
    bpy.context.view_layer.update()
    head_w = head.matrix_world.translation.copy()
    bpy.ops.object.light_add(type="SPOT", location=head_w + Vector((0, 0, 0.0)))
    L = bpy.context.active_object
    L.name = "light_lamp"
    L.data.energy = 60
    L.data.color = lin(srgb("#ffc690"))
    L.data.spot_size = math.radians(95)
    L.data.spot_blend = 0.9
    L.data.shadow_soft_size = 0.12
    pool = Vector((-0.08, 0.40, DESK_Z))
    L.rotation_euler = (pool - head_w).to_track_quat("-Z", "Y").to_euler()
    # a gentle fill so the metal arm and dish read against the wall
    bpy.ops.object.light_add(type="POINT", location=head_w + Vector((-0.25, 0.3, 0.12)))
    F = bpy.context.active_object
    F.name = "light_lamp_fill"
    F.data.energy = 9
    F.data.color = lin(srgb("#ffb27a"))
    F.data.shadow_soft_size = 0.08
    return root


# ------------------------------------------------------------------- frame --
def build_frame():
    root = empty("frame_root", FRAME_CENTER, (0, 0, 0))
    w, h, depth, border = 0.532, 0.767, 0.036, 0.042
    wood = mat("frame_wood", lin(srgb("#8c877e")), rough=0.45, metal=0.05)
    x = -depth / 2
    box("frame_top", (depth, w, border), (x, 0, h / 2 - border / 2), wood, bev=0.002, parent=root)
    box("frame_bot", (depth, w, border), (x, 0, -h / 2 + border / 2), wood, bev=0.002, parent=root)
    box("frame_l", (depth, border, h - 2 * border), (x, -w / 2 + border / 2, 0), wood, bev=0.002, parent=root)
    box("frame_r", (depth, border, h - 2 * border), (x, w / 2 - border / 2, 0), wood, bev=0.002, parent=root)
    backing = mat("frame_back", lin(srgb("#0e0c0b")), rough=0.8)
    box("frame_back", (0.004, w - 2 * border, h - 2 * border), (-0.004, 0, 0), backing, parent=root)
    poster = mat("poster", (0.1, 0.1, 0.1), rough=0.55, image="poster.png")
    plane("Poster", w - 2 * border - 0.01, h - 2 * border - 0.01, (-0.0075, 0, 0),
          (math.pi / 2, 0, -math.pi / 2), poster, parent=root)
    # picture light above the frame
    bpy.ops.object.light_add(type="SPOT", location=(LEFT_WALL_X - 0.12, FRAME_CENTER.y + 0.02, FRAME_CENTER.z + h / 2 + 0.12))
    L = bpy.context.active_object
    L.name = "light_picture"
    L.data.energy = 10
    L.data.color = lin(srgb("#ffb07a"))
    L.data.spot_size = math.radians(80)
    L.data.spot_blend = 1.0
    L.data.shadow_soft_size = 0.05
    tgt = Vector((LEFT_WALL_X, FRAME_CENTER.y, FRAME_CENTER.z - 0.05))
    d = tgt - L.location
    L.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return root


# ------------------------------------------------------------------- shelf --
def build_shelf():
    x0, x1, y, z = SHELF["x0"], SHELF["x1"], SHELF["y"], SHELF["z"]
    wood = mat("shelf_wood", lin(srgb("#4a2b18")), rough=0.5, coat=0.1)
    box("shelf_board", (x1 - x0, y, 0.035), ((x0 + x1) / 2, y / 2, z), wood, bev=0.003)
    led = mat("shelf_led", (1, 0.6, 0.3), emit=lin(srgb("#ff9a45")), emit_strength=2.2)
    box("shelf_led", (x1 - x0 - 0.04, 0.008, 0.004), ((x0 + x1) / 2, y - 0.03, z - 0.0195), led)
    bpy.ops.object.light_add(type="AREA", location=((x0 + x1) / 2, y - 0.03, z - 0.03))
    L = bpy.context.active_object
    L.name = "light_shelf"
    L.data.shape = "RECTANGLE"
    L.data.size = x1 - x0
    L.data.size_y = 0.02
    L.data.energy = 14
    L.data.color = lin(srgb("#ff9640"))
    L.data.spread = math.radians(140)
    L.rotation_euler = (math.radians(180 + 20), 0, 0)  # aim down, slightly toward wall
    top = z + 0.0175
    bpy.ops.object.light_add(type="POINT", location=(SHELF["x1"] - 0.2, SHELF["y"] + 0.1, z + 0.28))
    F = bpy.context.active_object
    F.name = "light_shelf_fill"
    F.data.energy = 5
    F.data.color = lin(srgb("#ffa860"))
    F.data.shadow_soft_size = 0.08
    return top


def build_books(top):
    rnd = random.Random(3)
    x = SHELF["x1"] - 0.03
    zs = [0.215, 0.235, 0.205, 0.225, 0.24, 0.21, 0.23]
    ths = [0.03, 0.036, 0.028, 0.034, 0.03, 0.032, 0.03]
    for i in range(7):
        h, t = zs[i], ths[i]
        col = [(0.02, 0.022, 0.026), (0.025, 0.025, 0.03), (0.018, 0.018, 0.02), (0.03, 0.03, 0.033),
               (0.02, 0.022, 0.027), (0.026, 0.025, 0.022), (0.03, 0.025, 0.022)][i]
        cover = mat(f"book_cover_{i}", col, rough=0.6)
        yoff = SHELF["y"] - 0.085 + rnd.uniform(-0.004, 0.004)
        b = box(f"book_{i}", (t, 0.15, h), (x - t / 2, yoff, top + h / 2), cover, bev=0.0015)
        # spine label (on the +y face)
        sp = mat(f"spine_{i}", (0.05, 0.05, 0.05), rough=0.6, image=f"spine_{i}.png")
        plane(f"spine_label_{i}", t * 0.98, h * 0.98, (x - t / 2, yoff + 0.0755, top + h / 2),
              (math.pi / 2, 0, math.pi), sp)
        x -= t + 0.002


def build_cat(top):
    root = empty("cat_root", (SHELF["x1"] - 0.30, SHELF["y"] - 0.08, top), (0, 0, math.radians(25)))
    ceramic = mat("cat_ceramic", (0.008, 0.008, 0.01), rough=0.22, coat=0.4)
    sphere("cat_body", 0.032, (0, 0, 0.042), ceramic, scale=(1, 0.9, 1.35), parent=root)
    sphere("cat_head", 0.028, (0, 0.002, 0.098), ceramic, scale=(1.1, 1, 0.95), parent=root)
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(radius1=0.014, radius2=0.0, depth=0.036, vertices=3)
        e = bpy.context.active_object
        e.name = "cat_ear"
        e.location = (sx * 0.02, 0.0, 0.13)
        e.rotation_euler = (0, math.radians(sx * 12), 0)
        assign(e, ceramic)
        e.parent = root
    curve_tube("cat_tail", [(-0.02, -0.025, 0.012), (-0.045, -0.03, 0.03), (-0.055, -0.02, 0.06),
                            (-0.045, -0.005, 0.085)], 0.0065, ceramic, parent=root, res=8)
    eye = mat("cat_eye", (0.9, 0.7, 0.2), emit=(0.9, 0.6, 0.15), emit_strength=0.8, rough=0.3)
    for sx in (-1, 1):
        sphere("cat_eye", 0.0035, (sx * 0.0105, 0.026, 0.102), eye, parent=root, seg=12, rings=8)


def build_candle(top):
    root = empty("candle_root", (SHELF["x1"] - 0.40, SHELF["y"] - 0.07, top))
    metal = mat("candle_cup", lin(srgb("#7d7466")), rough=0.3, metal=1.0)
    wax = mat("candle_wax", lin(srgb("#e9dcc0")), rough=0.6)
    cyl("candle_cup", 0.019, 0.016, (0, 0, 0.008), metal, parent=root)
    cyl("candle_wax", 0.0165, 0.015, (0, 0, 0.0165), wax, parent=root)
    flame = mat("candle_flame", (1, 0.7, 0.3), emit=lin(srgb("#ffb050")), emit_strength=120, rough=0.5)
    sphere("candle_flame", 0.0055, (0, 0, 0.032), flame, scale=(1, 1, 1.9), parent=root, seg=16, rings=10)
    bpy.ops.object.light_add(type="POINT", location=(root.location.x, root.location.y, root.location.z + 0.034))
    L = bpy.context.active_object
    L.name = "light_candle"
    L.data.energy = 6
    L.data.color = lin(srgb("#ff9a45"))
    L.data.shadow_soft_size = 0.006


# ------------------------------------------------------------------ plants --
def make_leaf_mesh(name, length, width, kind="heart", seg_l=10, seg_w=6, droop=0.25, twist=0.0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    grid = []
    for i in range(seg_l + 1):
        t = i / seg_l
        if kind == "heart":
            wt = width * (math.sin(math.pi * min(1.0, t * 1.05) ** 0.85) ** 0.75)
            lobe = 1.0 if t > 0.12 else (0.3 + 0.7 * t / 0.12)  # heart notch near base
        else:  # snake / sword leaf
            wt = width * (math.sin(math.pi * min(1.0, t ** 0.55)) ** 0.6)
            lobe = 1.0
        row = []
        for j in range(seg_w + 1):
            s = (j / seg_w) * 2 - 1
            x = s * wt * lobe
            y = t * length - (abs(s) * wt * 0.35 if kind == "heart" and t < 0.35 else 0)
            fold = abs(s) * wt * 0.22
            z = fold - droop * length * (t ** 2) * 0.5
            ang = twist * t
            x2 = x * math.cos(ang) - z * math.sin(ang)
            z2 = x * math.sin(ang) + z * math.cos(ang)
            row.append(bm.verts.new((x2, y, z2)))
        grid.append(row)
    for i in range(seg_l):
        for j in range(seg_w):
            bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    # UVs
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for l in f.loops:
            v = l.vert.co
            l[uv].uv = ((v.x / (width * 2 + 1e-6)) + 0.5, v.y / (length + 1e-6))
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return me


def build_pothos(top):
    rnd = random.Random(11)
    root = empty("pothos_root", (SHELF["x0"] + 0.09, SHELF["y"] - 0.08, top))
    root.scale = (0.8, 0.8, 0.8)
    ceramic = mat("pot_ceramic", lin(srgb("#cfc9bf")), rough=0.45)
    soil = mat("soil", lin(srgb("#1a120d")), rough=0.95)
    green = mat("pothos_leaf", lin(srgb("#5fa83e")), rough=0.4)
    green2 = mat("pothos_leaf2", lin(srgb("#3f7f2c")), rough=0.4)
    stem = mat("pothos_stem", lin(srgb("#4c7a2c")), rough=0.5)
    cyl("pot", 0.052, 0.085, (0, 0, 0.0425), ceramic, bev=0.003, parent=root)
    cyl("pot_soil", 0.046, 0.006, (0, 0, 0.082), soil, parent=root)
    meshes = [make_leaf_mesh(f"pothos_leaf_{i}", 0.11 + 0.015 * i, 0.058 + 0.006 * i, "heart") for i in range(3)]
    vines = [
        [(0, 0, 0.08), (-0.03, -0.02, 0.15), (-0.09, -0.03, 0.17), (-0.14, -0.02, 0.1), (-0.15, 0.0, 0.0),
         (-0.14, 0.02, -0.12), (-0.15, 0.03, -0.25)],
        [(0, 0, 0.08), (-0.02, 0.03, 0.13), (-0.07, 0.05, 0.14), (-0.1, 0.07, 0.06), (-0.1, 0.08, -0.06),
         (-0.11, 0.07, -0.18)],
        [(0, 0, 0.08), (0.03, 0.0, 0.14), (0.07, 0.01, 0.12), (0.1, 0.02, 0.04), (0.1, 0.04, -0.08)],
        [(0, 0, 0.08), (0, -0.03, 0.15), (0, -0.06, 0.16), (0.02, -0.08, 0.1), (0, -0.09, 0.0)],
        [(0, 0, 0.08), (-0.01, 0.0, 0.17), (0, 0.02, 0.2), (0.03, 0.03, 0.17)],
    ]
    for vi, pts in enumerate(vines):
        curve_tube(f"pothos_vine_{vi}", pts, 0.0012, stem, parent=root)
        # leaves along the vine
        for k in range(1, len(pts)):
            a, b = Vector(pts[k - 1]), Vector(pts[k])
            for q in range(3):
                p = a.lerp(b, 0.2 + 0.3 * q) + Vector((rnd.uniform(-0.004, 0.004), rnd.uniform(-0.004, 0.004), 0))
                me = rnd.choice(meshes)
                lf = bpy.data.objects.new(f"pothos_leaf_{vi}_{k}_{q}", me)
                bpy.context.collection.objects.link(lf)
                lf.data.materials.clear() if False else None
                if not lf.data.materials:
                    lf.data.materials.append(rnd.choice([green, green2]))
                lf.parent = root
                lf.location = p
                # leaf hangs mostly down, with random yaw
                lf.rotation_euler = (math.radians(rnd.uniform(110, 160)), 0, rnd.uniform(0, 2 * math.pi))
                s = rnd.uniform(0.8, 1.15)
                lf.scale = (s, s, s)
    return root


def build_snake_plant():
    rnd = random.Random(5)
    root = empty("snake_root", SNAKE_POS)
    root.scale = (0.85, 0.85, 0.85)
    pot = mat("snake_pot", lin(srgb("#6d6254")), rough=0.78)
    soil = mat("soil2", lin(srgb("#15100c")), rough=0.95)
    cyl("snake_pot", 0.095, 0.175, (0, 0, 0.0875), pot, bev=0.004, parent=root)
    cyl("snake_pot_rim", 0.104, 0.024, (0, 0, 0.166), pot, bev=0.004, parent=root)
    cyl("snake_soil", 0.088, 0.008, (0, 0, 0.17), soil, parent=root)
    leaf_mat = mat("snake_leaf", lin(srgb("#3b6140")), rough=0.32)
    leaf_mat2 = mat("snake_leaf2", lin(srgb("#2c4a31")), rough=0.32)
    n = 13
    for i in range(n):
        ang = i / n * 2 * math.pi + rnd.uniform(-0.2, 0.2)
        L = rnd.uniform(0.36, 0.62)
        Wd = rnd.uniform(0.042, 0.058)
        me = make_leaf_mesh(f"snake_leaf_{i}", L, Wd, "sword", seg_l=14, seg_w=4, droop=0.0, twist=rnd.uniform(-0.6, 0.6))
        o = bpy.data.objects.new(f"snake_leaf_{i}", me)
        bpy.context.collection.objects.link(o)
        o.data.materials.append(rnd.choice([leaf_mat, leaf_mat2]))
        o.parent = root
        r0 = rnd.uniform(0.01, 0.045)
        o.location = (math.cos(ang) * r0, math.sin(ang) * r0, 0.168)
        lean = math.radians(rnd.uniform(-8, 20))
        # leaf grows along local +Y; rotate X so +Y -> up, with a lean outward
        o.rotation_euler = (math.radians(90) - lean, 0, ang - math.pi / 2)
    return root


# ------------------------------------------------------------ lights/world --
def build_lights_and_world():
    w = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*lin(srgb("#07080f")), 1)
    bg.inputs["Strength"].default_value = 0.35
    # screen glow: cool area light in front of the monitor
    bpy.ops.object.light_add(type="AREA", location=(0, 0.08, 0.46))
    L = bpy.context.active_object
    L.name = "light_screen"
    L.data.shape = "RECTANGLE"
    L.data.size = 0.6
    L.data.size_y = 0.32
    L.data.energy = 1.6
    L.data.color = lin(srgb("#6f8fff"))
    L.parent = bpy.data.objects["monitor_root"]
    L.rotation_euler = (math.radians(-90), 0, 0)
    L.rotation_euler = (math.radians(-90), 0, 0)  # area emits along local -Z; here -> +Y? checked in preview
    # weak cool rim from the right so dark props still read
    bpy.ops.object.light_add(type="AREA", location=(-2.2, 1.6, 1.8))
    R = bpy.context.active_object
    R.name = "light_rim"
    R.data.size = 1.2
    R.data.energy = 20
    R.data.color = lin(srgb("#5a74c9"))
    d = Vector((-0.6, 0.3, 0.9)) - R.location
    R.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def build_camera():
    bpy.ops.object.camera_add(location=CAM_POS)
    cam = bpy.context.active_object
    cam.name = "Camera"
    cam.data.lens = CAM_LENS
    cam.data.sensor_width = 36
    cam.data.clip_start = 0.05
    d = CAM_TARGET - CAM_POS
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def setup_render(res, samples, out=None):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 4
    sc.cycles.glossy_bounces = 3
    sc.cycles.transmission_bounces = 2
    sc.cycles.sample_clamp_indirect = 8
    sc.render.threads_mode = "FIXED"
    sc.render.threads = 2
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    sc.view_settings.exposure = 0.0
    if out:
        sc.render.filepath = out
        sc.render.image_settings.file_format = "PNG"


def build_all():
    reset()
    build_room()
    build_monitor()
    build_keyboard()
    build_lamp()
    build_frame()
    top = build_shelf()
    build_books(top)
    build_cat(top)
    build_candle(top)
    build_pothos(top)
    build_snake_plant()
    build_lights_and_world()
    build_camera()


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "preview.png"))
    ap.add_argument("--res", default="960x540")
    ap.add_argument("--samples", type=int, default=32)
    ap.add_argument("--save", default="")
    ap.add_argument("--exposure", type=float, default=0.0)
    ap.add_argument("--no-render", action="store_true")
    a = ap.parse_args(argv)
    res = tuple(int(v) for v in a.res.split("x"))
    build_all()
    setup_render(res, a.samples, a.out)
    bpy.context.scene.view_settings.exposure = a.exposure
    if a.save:
        bpy.ops.wm.save_as_mainfile(filepath=a.save)
    if not a.no_render:
        bpy.ops.render.render(write_still=True)
        print("rendered", a.out)
