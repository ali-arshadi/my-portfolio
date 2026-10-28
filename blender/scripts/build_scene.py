"""Builds every asset into one Blender scene, adds the camera and lights, optionally renders a preview.

    python -I scripts/build_scene.py [--render out.png] [--res 836x470] [--samples 24] [--save scene.blend]
"""
import argparse
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import config as C  # noqa: E402
import create_desk  # noqa: E402
import create_room  # noqa: E402
from shared import materials, validation  # noqa: E402
from shared.geometry import reset  # noqa: E402

# Order matters only for readability of the outliner.
ASSETS = [create_room, create_desk]

# Temporary lighting until the bake in Phase 4: just enough to judge composition.
# (name, type, Blender position, colour, power W, aim point or None, size)
TEMP_LIGHTS = [
    ("lamp", "SPOT", (0.60, 0.30, 1.13), "#ffc690", 60, (-0.08, 0.40, C.DESK_Z), 0.12),
    ("shelf_led", "AREA", (0.14, 0.12, 1.44), "#ffc47f", 25, (0.14, 0.12, 0.0), (1.0, 0.03)),
    ("monitor", "AREA", (-0.468, 0.50, 1.22), "#6f8fff", 2, (-0.468, 2.0, 1.22), (0.6, 0.32)),
]


def build_lights():
    from mathutils import Vector
    w = bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*materials.lin(materials.srgb("#07080f")), 1)
    bg.inputs["Strength"].default_value = 0.35
    for name, kind, pos, color, power, aim, size in TEMP_LIGHTS:
        data = bpy.data.lights.new(f"light_{name}", kind)
        data.energy = power
        data.color = materials.lin(materials.srgb(color))
        if kind == "SPOT":
            data.spot_size = math.radians(95)
            data.spot_blend = 0.9
            data.shadow_soft_size = size
        else:
            data.shape = "RECTANGLE"
            data.size, data.size_y = size
        o = bpy.data.objects.new(f"light_{name}", data)
        bpy.context.collection.objects.link(o)
        o.location = pos
        o.rotation_euler = (Vector(aim) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()


def build_camera():
    data = bpy.data.cameras.new("Camera")
    data.lens = C.CAMERA["lens"]
    data.sensor_width = C.CAMERA["sensor_width"]
    data.sensor_fit = "HORIZONTAL"
    data.clip_start = 0.05
    cam = bpy.data.objects.new("Camera", data)
    bpy.context.collection.objects.link(cam)
    cam.location = C.CAMERA["pos"]
    cam.rotation_euler = (C.camera_target() - C.CAMERA["pos"]).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def build_all():
    """Returns {asset name: (root, stats)}; every asset is validated as it is built."""
    reset()
    built = {}
    for mod in ASSETS:
        root = mod.build()
        built[mod.NAME] = (root, validation.check_scene(root, mod.EXPECT))
    validation.assert_no_orphans()
    build_lights()
    build_camera()
    return built


def setup_render(res, samples, out):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.threads_mode = "FIXED"
    sc.render.threads = max(1, (os.cpu_count() or 2) - 2)
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.exposure = 0.7
    sc.render.filepath = out
    sc.render.image_settings.file_format = "PNG"


def render(out, res=(836, 470), samples=24):
    setup_render(res, samples, os.path.abspath(out))
    bpy.ops.render.render(write_still=True)
    return out


def run_single(build, expect):
    """Entry point for running one create_*.py alone: build, validate, print stats."""
    reset()
    root = build()
    print(root.name, validation.check_scene(root, expect))


def parse_res(s):
    w, h = s.lower().split("x")
    return int(w), int(h)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--render", default="")
    ap.add_argument("--res", default="836x470")
    ap.add_argument("--samples", type=int, default=24)
    ap.add_argument("--save", default="")
    a = ap.parse_args()
    for name, (_root, stats) in build_all().items():
        print(f"{name}: {stats}")
    if a.save:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.save))
    if a.render:
        print("rendered", render(a.render, parse_res(a.res), a.samples))
