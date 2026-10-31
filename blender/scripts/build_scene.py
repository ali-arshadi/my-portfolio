"""Builds every asset into one Blender scene, adds the camera and lights, optionally renders a preview.

    python -I scripts/build_scene.py [--render out.png] [--res 836x470] [--samples 24] [--save scene.blend]
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import config as C  # noqa: E402
import create_books  # noqa: E402
import create_candle  # noqa: E402
import create_desk  # noqa: E402
import create_desk_lamp  # noqa: E402
import create_figurine  # noqa: E402
import create_floor_plant  # noqa: E402
import create_keyboard  # noqa: E402
import create_monitor  # noqa: E402
import create_mouse  # noqa: E402
import create_room  # noqa: E402
import create_shelf  # noqa: E402
import create_shelf_plant  # noqa: E402
import create_wall_poster  # noqa: E402
import lights  # noqa: E402
from shared import textures, validation  # noqa: E402
from shared.geometry import pack_lightmaps, reset  # noqa: E402

# Order matters only for readability of the outliner.
ASSETS = [create_room, create_desk, create_monitor, create_keyboard, create_mouse, create_desk_lamp, create_wall_poster,
          create_shelf, create_books, create_figurine, create_candle, create_shelf_plant, create_floor_plant]


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
    textures.build_all(C.BOOKS)
    built = {}
    for mod in ASSETS:
        root = mod.build()
        pack_lightmaps(root)
        built[mod.NAME] = (root, validation.check_scene(root, mod.EXPECT))
    validation.assert_no_orphans()
    lights.build()
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
    sc.view_settings.exposure = lights.EXPOSURE
    sc.render.filepath = out
    sc.render.image_settings.file_format = "PNG"


def render(out, res=(836, 470), samples=24, layers=("base", "lamp")):
    setup_render(res, samples, os.path.abspath(out))
    lights.use_layers(*layers)
    bpy.ops.render.render(write_still=True)
    return out


def run_single(build, expect):
    """Entry point for running one create_*.py alone: build, validate, print stats."""
    reset()
    textures.build_all(C.BOOKS)
    root = build()
    pack_lightmaps(root)
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
