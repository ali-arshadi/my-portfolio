"""The scene's lights, split into the two baked layers.

    base  everything that stays on: shelf LED, candle, monitor glow, picture light, cool rim, world fill
    lamp  the desk lamp alone, so the site can fade it in and out

Emissive materials belong to a layer too: when a layer is baked or rendered, the other layer's emitters
are switched off. Powers are Blender watts; they were tuned against docs/reference/reference.webp.
"""
import math

import bpy
from mathutils import Matrix, Vector

import config as C
import create_candle
import create_desk_lamp
from shared import materials

WORLD = dict(color="#1c2232", strength=1.4)

# Emissive materials per layer (see shared/materials.py).
EMITTERS = {
    "base": ["shelf_led", "candle_flame", "monitor_screen", "monitor_led"],
    "lamp": ["lamp_bulb", "lamp_shade_inner"],
}

# Exposure the preview renders and the site both use (AgX view transform / tone mapping).
EXPOSURE = 0.7

# The reference's lamp pool is a large soft gradient from the lamp base past the keyboard.
LAMP_CONE = dict(angle=60, blend=1.0)
# Full cone angles (degrees) of the other spots.
SPOT_ANGLES = dict(picture=75, lamp_fringe=40)
# Area lights that throw a narrower beam than a bare panel (Blender's "spread", degrees).
# (none at the moment: a narrowed LED spread cut its wash off in hard edges at the strip's ends)
SPREAD = {}


def rig():
    """(name, layer, type, position, colour, watts, aim point, size); positions are Blender world."""
    bulb, pool = create_desk_lamp.light_anchor()
    s = C.SHELF
    led = Vector(((s["x"][0] + s["x"][1]) / 2, s["depth"] - 0.03, s["top"] - s["thickness"] - 0.01))
    m = C.MONITOR
    turn = Matrix.Rotation(m["yaw"], 3, "Z")
    screen, normal = m["pos"] + turn @ m["screen_center"], turn @ Vector((0, 1, 0))
    p = C.POSTER
    # a picture lamp just above the frame and a little out from the wall, as the reference's bright pool
    # on the top of the mat and the wall above it suggests
    picture = Vector((C.LEFT_WALL_X - 0.14, p["center"].y, p["center"].z + p["opening"][1] / 2 + 0.12))
    candle = Vector((C.CANDLE["x"], C.SHELF_PROPS["candle_y"], s["top"] + create_candle.flame_height()))
    return [
        ("lamp", "lamp", "SPOT", bulb, "#ff9a40", 55, pool, 0.03),
        # the lamp's glow in the wall corner behind it: the reference shows that corner and the poster's
        # lower half warm. It sits below the shelf, so the board keeps it off the books
        ("lamp_glow", "lamp", "POINT", Vector((C.LEFT_WALL_X - 0.32, 0.32, 1.02)), "#ff9a40", 1.4, pool, 0.15),
        # the faint outer fringe of the dish's beam, reaching the floor plant's pot at the right end of
        # the desk, which the reference shows lit warm from the left
        ("lamp_fringe", "lamp", "SPOT", bulb, "#ff9a40", 25, C.FLOOR_PLANT["pos"] + Vector((0, 0, 0.12)), 0.05),
        # the strip washes the wall under the shelf, so it aims down and back
        ("shelf_led", "base", "AREA", led, "#ff8a3a", 0.9, led + Vector((0, -1, -0.6)),
         (s["x"][1] - s["x"][0] - 0.04, 0.02)),
        ("candle", "base", "POINT", candle, "#ffb15a", 0.5, candle - Vector((0, 0, 1)), 0.01),
        ("monitor", "base", "AREA", screen + normal * 0.02, "#6f8fff", 0.6, screen + normal * 2, (0.6, 0.32)),
        # a warm picture light above the poster: the reference's frame top is lit from above
        ("picture", "base", "SPOT", picture, "#ffb07a", 2.4, p["center"] + Vector((0, 0, 0.2)), 0.03),
        # a small warm fill so the books and figurine read, as the reference's shelf does
        ("shelf_fill", "base", "POINT", Vector((0.2, 0.45, 1.65)), "#ffb070", 0.25, Vector((0.2, 0.1, 1.4)), 0.1),
        # a cool rim from the right so the plant and the monitor's right edge read against the dark
        ("rim", "base", "AREA", Vector((-2.0, 1.2, 1.7)), "#5a74c9", 3, Vector((-0.6, 0.3, 1.0)), (1.0, 1.0)),
        # cool night light from the front right washing the right half of the back wall, which the
        # reference shows as a deep navy gradient rather than black; it falls off before the poster side
        ("wall_wash", "base", "AREA", Vector((-1.7, 1.6, 2.1)), "#2f4590", 4, Vector((-0.9, 0.0, 1.35)),
         (1.4, 1.4)),
    ]


def build():
    w = bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*materials.lin(materials.srgb(WORLD["color"])), 1)
    bg.inputs["Strength"].default_value = WORLD["strength"]
    lights = {}
    for name, layer, kind, pos, color, watts, aim, size in rig():
        data = bpy.data.lights.new(f"light_{name}", kind)
        data.energy = watts
        data.color = materials.lin(materials.srgb(color))
        if kind == "SPOT":
            data.spot_size = math.radians(LAMP_CONE["angle"] if name == "lamp" else SPOT_ANGLES[name])
            data.spot_blend = LAMP_CONE["blend"] if name == "lamp" else 1.0
            data.shadow_soft_size = size
        elif kind == "POINT":
            data.shadow_soft_size = size
        else:
            data.shape = "RECTANGLE"
            data.size, data.size_y = size
            data.spread = math.radians(SPREAD.get(name, 180))
        o = bpy.data.objects.new(f"light_{name}", data)
        bpy.context.collection.objects.link(o)
        o.location = pos
        o.rotation_euler = (Vector(aim) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
        o["layer"] = layer
        lights[name] = o
    return lights


def use_layers(*layers):
    """Switch on only the lights, emitters and world fill of `layers`."""
    for o in bpy.data.objects:
        if o.type == "LIGHT":
            o.hide_render = o.get("layer") not in layers
    for layer, names in EMITTERS.items():
        for name in names:
            m = bpy.data.materials.get(name)
            if not m:
                continue
            bsdf = m.node_tree.nodes["Principled BSDF"]
            spec = materials.LIBRARY[name]
            bsdf.inputs["Emission Strength"].default_value = spec.get("emit_strength", 1.0) if layer in layers else 0
    bg = bpy.context.scene.world.node_tree.nodes["Background"]
    bg.inputs["Strength"].default_value = WORLD["strength"] if "base" in layers else 0
