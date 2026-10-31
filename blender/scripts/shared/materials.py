"""Named PBR material library. Every colour and roughness in the scene is defined here.

Colours are sRGB hex (picked from the reference, then adjusted for albedo) and converted to linear for
Blender. Optional keys: metal, specular (Principled "Specular IOR Level", 0.5 = default), image (file in
the generated texture folder), emit + emit_strength, alpha, emit_only (the image drives only the
emission; the surface colour stays `color`).
"""
import os

import bpy

TEX_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "tex")

LIBRARY = {
    # room
    # deep slate limewash (the colour and its cloudy variation live in the generated texture,
    # shared/textures.py); a real dark paint, about 2% reflectance, so light reads on it
    "wall": dict(color="#ffffff", rough=0.92, image="plaster.png"),
    "floor": dict(color="#15161b", rough=0.85),
    # a low specular level: the lamp sits in front of the camera, so a glossy desk throws a long sheen
    # toward it that the reference does not have
    "desk_wood": dict(color="#261a12", rough=0.8, specular=0.2),
    "desk_leg": dict(color="#0d0d10", rough=0.5, metal=0.6),
    # monitor
    "monitor_plastic": dict(color="#0a0b0e", rough=0.55, metal=0.1),
    "monitor_bezel": dict(color="#050507", rough=0.28, metal=0.1),
    # graphite aluminium stand plate, and the chin's small white power light
    "monitor_stand": dict(color="#1a1a1e", rough=0.3, metal=0.75),
    "monitor_led": dict(color="#ffffff", rough=0.5, emit="#dceaff", emit_strength=3.0),
    "monitor_screen": dict(color="#000000", rough=0.25, image="screen.png", emit_image=True, emit_strength=0.75),
    # keyboard
    # a dark anodised case whose rounded edge catches the lamp; low-profile caps with printed legends
    "keyboard_case": dict(color="#2a2a30", rough=0.32, metal=0.7),
    "keyboard_plate": dict(color="#0c0c0f", rough=0.6),
    "keyboard_key": dict(color="#ffffff", rough=0.55, specular=0.3, image="keycaps.png"),
    # mouse: satin black shell, rubber wheel
    "mouse_shell": dict(color="#121214", rough=0.45),
    "mouse_wheel": dict(color="#0a0a0b", rough=0.75),
    # desk lamp (the shade's glow is painted, centre to rim, so the browser shows the same gradient: emissive
    # surfaces are not baked, so they carry no light from the bulb)
    "lamp_metal": dict(color="#8a6440", rough=0.35, metal=0.6),
    "lamp_dark": dict(color="#211d1a", rough=0.45, metal=0.6),
    "lamp_shade_inner": dict(color="#1a1410", rough=0.6, specular=0.0, image="shade.png", emit_image=True, emit_only=True,
                             emit_strength=2.2),
    "lamp_bulb": dict(color="#fff4e0", rough=0.3, emit="#ffe2b0", emit_strength=6.0),
    # wall poster
    "frame_wood": dict(color="#0c0b0a", rough=0.38),
    "poster_mat": dict(color="#968d80", rough=0.9),
    "poster_print": dict(color="#ffffff", rough=0.7, image="poster.png"),
    # picture glass: only a faint glint; a white, partly opaque sheet veiled the whole print
    "glass": dict(color="#000000", rough=0.05, alpha=0.04),
    # shelf
    "shelf_wood": dict(color="#3a2416", rough=0.55),
    "shelf_led": dict(color="#ffb070", rough=0.5, emit="#ff7a20", emit_strength=1.2),
    # books (covers come from config.BOOKS; spines share one atlas image)
    "book_spine": dict(color="#ffffff", rough=0.7, image="spines.png"),
    # figurine and candle
    # satin vinyl collectible: black body, a muted peach face, small glossy black eyes
    "figurine_vinyl": dict(color="#16161a", rough=0.42),
    "figurine_face": dict(color="#5c4b42", rough=0.5),
    "figurine_eyes": dict(color="#060608", rough=0.12),
    "candle_glass": dict(color="#c98a4a", rough=0.15, alpha=0.75),
    "candle_wax": dict(color="#efe4d0", rough=0.6),
    "candle_flame": dict(color="#ffe2a8", rough=0.5, emit="#ffc86e", emit_strength=20.0),
    # plants
    "pot_ceramic": dict(color="#c9bfae", rough=0.32),
    "pot_stone": dict(color="#ffffff", rough=0.85, image="concrete.png"),
    "soil": dict(color="#1a120d", rough=0.95),
    # leaf colour, variegation and veins come from generated textures (shared/textures.py)
    "pothos_leaf": dict(color="#ffffff", rough=0.38, image="pothos.png"),
    "pothos_stem": dict(color="#4c7a2c", rough=0.5),
    "snake_leaf": dict(color="#ffffff", rough=0.4, image="snake.png"),
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
        if not spec.get("emit_only"):
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
