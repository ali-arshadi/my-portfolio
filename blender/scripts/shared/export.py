"""glTF export, one GLB per asset root."""
import json
import os
import struct

import bpy

from .geometry import descendants


def export_asset(root, path):
    """Export `root` and everything under it, in world space, to a binary glTF."""
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in descendants(root):
        o.select_set(True)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_extras=True,
    )
    return path


def glb_json(path):
    """The JSON chunk of a .glb file."""
    with open(path, "rb") as f:
        data = f.read()
    magic, _version, _length = struct.unpack("<4sII", data[:12])
    if magic != b"glTF":
        raise ValueError(f"{path} is not a GLB file")
    size, kind = struct.unpack("<I4s", data[12:20])
    if kind != b"JSON":
        raise ValueError(f"{path}: first chunk is not JSON")
    return json.loads(data[20:20 + size])
