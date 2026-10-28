"""Bake the lighting of scene.py into textures and export a single .glb.

    python -I bake_export.py --out-dir out --samples 128 [--only name1,name2] [--scale 1.0]

Result in <out-dir>:
    desk-scene.glb              baked static scene (+ "Screen" and "glow_*" emissive meshes)
    bake/<name>.jpg             the baked textures (also embedded in the .glb)
"""
import argparse
import math
import os
import sys

import bpy
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scene as S  # noqa: E402

# name -> (object-name matcher, texture size (w, h), keep own UV)
EXPOSURE = 0.7


def starts(*prefixes):
    return lambda n: any(n == p or n.startswith(p + ".") or n.startswith(p + "_") or n.startswith(p) for p in prefixes)


GROUPS = [
    # (group name, predicate, (w, h), own_uv)
    ("back_wall", lambda n: n.startswith("back_wall"), (1536, 816), False),
    ("left_wall", lambda n: n.startswith("left_wall"), (1024, 1024), False),
    ("floor", lambda n: n.startswith("floor"), (256, 256), False),
    ("desk", lambda n: n.startswith("desk_"), (2048, 512), False),
    ("monitor_body", lambda n: n.startswith("monitor_"), (1024, 1024), False),
    ("keyboard", lambda n: n.startswith("kb_") or n.startswith("key_"), (1024, 1024), False),
    ("lamp_metal", lambda n: n.startswith("lamp_") and not n.startswith("lamp_bulb"), (1024, 1024), False),
    ("frame", lambda n: n.startswith("frame_"), (1024, 1024), False),
    ("poster", lambda n: n.startswith("Poster"), (1536, 2048), True),
    ("shelf", lambda n: n.startswith("shelf_board"), (1024, 512), False),
    ("books", lambda n: n.startswith("book_"), (1024, 1024), False),
    ("cat", lambda n: n.startswith("cat_") and not n.startswith("cat_eye"), (512, 512), False),
    ("candle", lambda n: n.startswith(("candle_cup", "candle_wax")), (256, 256), False),
    ("pothos_pot", lambda n: n in ("pot", "pot_soil") or n.startswith(("pot.", "pot_soil.")), (512, 512), False),
    ("pothos_leaves", lambda n: n.startswith(("pothos_leaf", "pothos_vine")), (1024, 1024), False),
    ("snake_pot", lambda n: n.startswith("snake_pot") or n.startswith("snake_soil"), (512, 512), False),
    ("snake_leaves", lambda n: n.startswith("snake_leaf"), (1024, 1024), False),
]
for i in range(7):
    GROUPS.append((f"spine_{i}", (lambda k: (lambda n: n.startswith(f"spine_label_{k}")))(i), (256, 1024), True))

GLOW = {
    "glow_lamp": lambda n: n.startswith("lamp_bulb"),
    "glow_shelf_led": lambda n: n.startswith("shelf_led"),
    "glow_flame": lambda n: n.startswith("candle_flame"),
    "glow_cat_eyes": lambda n: n.startswith("cat_eye"),
}


def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    if objs:
        bpy.context.view_layer.objects.active = objs[0]


def flatten_scene():
    """single-user meshes, curves -> mesh, clear parents, apply transforms."""
    objs = [o for o in bpy.context.scene.objects if o.type in {"MESH", "CURVE"}]
    select_only(objs)
    bpy.ops.object.make_single_user(object=True, obdata=True, material=False, animation=False)
    curves = [o for o in objs if o.type == "CURVE"]
    if curves:
        select_only(curves)
        bpy.ops.object.convert(target="MESH")
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    select_only(objs)
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def join_group(name, objs):
    select_only(objs)
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    o.data.name = name
    return o


def unwrap_new_uv(o):
    me = o.data
    layer = me.uv_layers.new(name="bake_uv")
    me.uv_layers.active = layer
    select_only([o])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004, area_weight=0.0)
    bpy.ops.object.mode_set(mode="OBJECT")


STRONG = {"back_wall", "left_wall", "desk", "floor"}


def bake_object(o, size, own_uv, samples, out_dir, do_bake=True):
    name = o.name
    w, h = size
    if not own_uv:
        unwrap_new_uv(o)
    else:
        me = o.data
        me.uv_layers.active = me.uv_layers[0]
    jpg = os.path.join(out_dir, "bake", f"{name}.jpg")
    if do_bake:
        img = bpy.data.images.new(f"bake_{name}", w, h, alpha=False, float_buffer=True)
        img.colorspace_settings.name = "Linear Rec.709"
        # every material needs the target image node selected + active
        for slot in o.material_slots:
            nt = slot.material.node_tree
            node = nt.nodes.new("ShaderNodeTexImage")
            node.image = img
            for n in nt.nodes:
                n.select = False
            node.select = True
            nt.nodes.active = node
        sc = bpy.context.scene
        sc.cycles.samples = samples
        sc.cycles.use_denoising = False
        sc.cycles.sample_clamp_direct = 6.0
        sc.cycles.sample_clamp_indirect = 3.0
        select_only([o])
        bpy.ops.object.bake(type="COMBINED", margin=6, margin_type="EXTEND", use_clear=True)
        # tone-map with the scene's view transform exactly like the preview render
        raw = os.path.join(out_dir, "bake", f"{name}_raw.png")
        img.save_render(raw, scene=sc)
        bgr = cv2.imread(raw, cv2.IMREAD_COLOR)
        os.remove(raw)
        if name in STRONG:
            bgr = cv2.medianBlur(bgr, 3)
            bgr = cv2.fastNlMeansDenoisingColored(bgr, None, 9, 9, 7, 21)
        elif not own_uv:
            bgr = cv2.fastNlMeansDenoisingColored(bgr, None, 6, 6, 5, 15)
        cv2.imwrite(jpg, bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
        bpy.data.images.remove(img)
    # replace the materials by one that only shows the baked texture
    final = bpy.data.images.load(jpg)
    final.colorspace_settings.name = "sRGB"
    m = bpy.data.materials.new(f"baked_{name}")
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    tex = m.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = final
    m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Metallic"].default_value = 0.0
    o.data.materials.clear()
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.material_index = 0
    # keep only the UV set the bake used
    if not own_uv:
        me = o.data
        for layer in list(me.uv_layers):
            if layer.name != "bake_uv":
                me.uv_layers.remove(layer)
    else:
        me = o.data
        for layer in list(me.uv_layers)[1:]:
            me.uv_layers.remove(layer)
    print("baked", name, size, flush=True)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=os.path.join(S.HERE, "out"))
    ap.add_argument("--samples", type=int, default=128)
    ap.add_argument("--only", default="")
    ap.add_argument("--scale", type=float, default=1.0, help="multiply all texture sizes")
    ap.add_argument("--save", default="")
    a = ap.parse_args(argv)
    os.makedirs(os.path.join(a.out_dir, "bake"), exist_ok=True)

    S.build_all()
    S.setup_render((960, 540), a.samples, None)
    bpy.context.scene.view_settings.exposure = EXPOSURE
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.image_settings.color_mode = "RGB"
    bpy.context.scene.render.image_settings.color_depth = "8"

    flatten_scene()
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]

    # Screen stays a live emissive plane
    taken = set()
    glow_objs = {}
    for gname, pred in GLOW.items():
        objs = [o for o in meshes if pred(o.name)]
        if objs:
            glow_objs[gname] = objs
            taken.update(o.name for o in objs)
    screen = [o for o in meshes if o.name.startswith("Screen")]
    taken.update(o.name for o in screen)

    baked_groups = []
    for gname, pred, size, own_uv in GROUPS:
        objs = [o for o in meshes if o.name not in taken and pred(o.name)]
        if not objs:
            continue
        taken.update(o.name for o in objs)
        baked_groups.append((gname, objs, size, own_uv))
    leftovers = [o.name for o in meshes if o.name not in taken]
    if leftovers:
        print("WARNING unassigned objects:", leftovers, flush=True)

    only = set(x for x in a.only.split(",") if x)
    # join glow groups
    for gname, objs in glow_objs.items():
        join_group(gname, objs)
    if screen:
        screen[0].name = "Screen"
    for gname, objs, size, own_uv in baked_groups:
        o = join_group(gname, objs)
        if only and gname not in only:
            # keep the texture from an earlier bake (same deterministic UV layout)
            bake_object(o, size, own_uv, a.samples, a.out_dir, do_bake=False)
            continue
        size = (max(64, int(size[0] * a.scale)), max(64, int(size[1] * a.scale)))
        bake_object(o, size, own_uv, a.samples, a.out_dir, do_bake=True)

    # lights/camera are not exported; remove helper empties
    for o in list(bpy.context.scene.objects):
        if o.type in {"EMPTY"}:
            bpy.data.objects.remove(o)
    if a.save:
        bpy.ops.wm.save_as_mainfile(filepath=a.save)

    glb = os.path.join(a.out_dir, "desk-scene.glb")
    bpy.ops.object.select_all(action="DESELECT")
    for o in bpy.context.scene.objects:
        if o.type == "MESH":
            o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=glb,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_cameras=False,
        export_lights=False,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_extras=False,
    )
    print("exported", glb, os.path.getsize(glb) // 1024, "KB", flush=True)


if __name__ == "__main__":
    main()
