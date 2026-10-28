"""Named PBR material library. Every colour and roughness in the scene is defined here.

Colours are sRGB hex (as picked from the reference) and converted to linear for Blender.
"""
import bpy

# name -> Principled BSDF settings
LIBRARY = {
    "wall": dict(color="#2b2c33", rough=0.95),
    "floor": dict(color="#15161b", rough=0.85),
    "desk_wood": dict(color="#1f1b18", rough=0.75),
    "desk_leg": dict(color="#0d0d10", rough=0.5, metal=0.6),
}


def srgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def lin(c):
    """sRGB 0-1 tuple -> linear."""
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)


def get(name):
    """Return the material called `name`, creating it from LIBRARY on first use."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    spec = LIBRARY[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*lin(srgb(spec["color"])), 1)
    bsdf.inputs["Roughness"].default_value = spec.get("rough", 0.5)
    bsdf.inputs["Metallic"].default_value = spec.get("metal", 0.0)
    return m
