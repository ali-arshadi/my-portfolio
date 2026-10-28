"""Named PBR material library. Every colour and roughness in the scene is defined here.

Colours are sRGB hex (picked from the reference, then adjusted for albedo) and converted to linear for
Blender. Optional keys: metal, specular (Principled "Specular IOR Level", 0.5 = default), image (file in
the generated texture folder), emit + emit_strength, alpha.
"""
import os

import bpy

TEX_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "tex")

LIBRARY = {
    # room
    "wall": dict(color="#16171b", rough=0.95),
    "floor": dict(color="#15161b", rough=0.85),
    # a low specular level: the lamp sits in front of the camera, so a glossy desk throws a long sheen
    # toward it that the reference does not have
    "desk_wood": dict(color="#261a12", rough=0.8, specular=0.2),
    "desk_leg": dict(color="#0d0d10", rough=0.5, metal=0.6),
    # monitor
    "monitor_plastic": dict(color="#0a0b0e", rough=0.55, metal=0.1),
    "monitor_bezel": dict(color="#050507", rough=0.35, metal=0.1),
    "monitor_screen": dict(color="#000000", rough=0.25, image="screen.png", emit_image=True, emit_strength=0.45),
    # keyboard
    "keyboard_case": dict(color="#17171c", rough=0.4, metal=0.2),
    "keyboard_key": dict(color="#1c1b21", rough=0.45),
    # desk lamp
    "lamp_metal": dict(color="#6e5236", rough=0.35, metal=0.85),
    "lamp_dark": dict(color="#211d1a", rough=0.45, metal=0.6),
    "lamp_shade_inner": dict(color="#f4e6cf", rough=0.6, emit="#ffb35c", emit_strength=1.2),
    "lamp_bulb": dict(color="#fff4e0", rough=0.3, emit="#ffe2b0", emit_strength=6.0),
    # wall poster
    "frame_wood": dict(color="#151210", rough=0.5),
    "poster_mat": dict(color="#b8afa2", rough=0.85),
    "poster_print": dict(color="#ffffff", rough=0.7, image="poster.png"),
    "glass": dict(color="#ffffff", rough=0.05, alpha=0.06),
    # shelf
    "shelf_wood": dict(color="#3a2416", rough=0.55),
    "shelf_led": dict(color="#ffd2a0", rough=0.5, emit="#ff9a45", emit_strength=3.0),
    # books (covers come from config.BOOKS; spines share one atlas image)
    "book_spine": dict(color="#ffffff", rough=0.7, image="spines.png"),
    # figurine and candle
    "figurine_ceramic": dict(color="#121215", rough=0.22),
    "figurine_eyes": dict(color="#ffd27a", rough=0.4, emit="#ffb54a", emit_strength=2.0),
    "candle_glass": dict(color="#c98a4a", rough=0.15, alpha=0.75),
    "candle_wax": dict(color="#efe4d0", rough=0.6),
    "candle_flame": dict(color="#ffe2a8", rough=0.5, emit="#ffc86e", emit_strength=20.0),
    # plants
    "pot_ceramic": dict(color="#d2ccc2", rough=0.45),
    "pot_stone": dict(color="#6d6254", rough=0.8),
    "soil": dict(color="#1a120d", rough=0.95),
    "pothos_leaf": dict(color="#4f8a37", rough=0.4),
    "pothos_leaf_dark": dict(color="#376b28", rough=0.4),
    "pothos_stem": dict(color="#4c7a2c", rough=0.5),
    "snake_leaf": dict(color="#3b6140", rough=0.32),
    "snake_leaf_dark": dict(color="#2c4a31", rough=0.32),
    # invisible hit areas for interaction (the site hides them)
    "proxy": dict(color="#ff00ff", rough=1.0),
}


def srgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def lin(c):
    """sRGB 0-1 tuple -> linear."""
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)


def get(name, spec=None):
    """Return the material called `name`, creating it on first use from LIBRARY (or `spec`, for
    per-object colours such as book covers)."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    spec = spec or LIBRARY[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*lin(srgb(spec["color"])), 1)
    bsdf.inputs["Roughness"].default_value = spec.get("rough", 0.5)
    bsdf.inputs["Metallic"].default_value = spec.get("metal", 0.0)
    if "specular" in spec:
        bsdf.inputs["Specular IOR Level"].default_value = spec["specular"]

    if "image" in spec:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(os.path.join(TEX_DIR, spec["image"]), check_existing=True)
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if spec.get("emit_image"):
            nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    if "emit" in spec:
        bsdf.inputs["Emission Color"].default_value = (*lin(srgb(spec["emit"])), 1)
    if "emit" in spec or spec.get("emit_image"):
        bsdf.inputs["Emission Strength"].default_value = spec.get("emit_strength", 1.0)
    if "alpha" in spec:
        bsdf.inputs["Alpha"].default_value = spec["alpha"]
        m.surface_render_method = "BLENDED"
    return m
