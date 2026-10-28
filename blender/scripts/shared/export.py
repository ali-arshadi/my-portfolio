"""glTF export, one GLB per asset root."""
import json
import os
import struct

import bpy  # must load before bmesh
import bmesh
import numpy as np

from .geometry import descendants


def triangulate(root):
    """Triangulate with fixed diagonals; the exporter's own triangulation can pick different diagonals
    on near-planar quads from run to run."""
    for o in descendants(root):
        if o.type != "MESH":
            continue
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method="FIXED", ngon_method="EAR_CLIP")
        bm.to_mesh(o.data)
        bm.free()


def export_asset(root, path):
    """Export `root` and everything under it, in world space, to a binary glTF."""
    triangulate(root)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in descendants(root):
        o.select_set(True)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp.glb"
    bpy.ops.export_scene.gltf(
        filepath=tmp,
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
        export_attributes=True,  # custom attributes such as the plants' _sway weight
    )
    # Blender computes some mesh data on several threads, so vertex order and merging inside a GLB can
    # change between runs. Keep the existing file when the geometry is the same, so unchanged assets
    # never show up in a diff.
    if os.path.exists(path) and same_asset(path, tmp):
        os.remove(tmp)
    else:
        os.replace(tmp, path)
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


_COMPONENTS = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
_WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def _read_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    size = struct.unpack("<I", data[12:16])[0]
    return json.loads(data[20:20 + size]), data[20 + size + 8:]


def _accessor(j, binary, i):
    a = j["accessors"][i]
    view = j["bufferViews"][a["bufferView"]]
    offset = view.get("byteOffset", 0) + a.get("byteOffset", 0)
    n = a["count"] * _WIDTH[a["type"]]
    return np.frombuffer(binary, _COMPONENTS[a["componentType"]], n, offset).reshape(a["count"], -1)


def _fingerprint(path):
    """Order-independent summary: per primitive attribute, the sum and sum of squares over every
    triangle corner; plus the raw bytes of embedded images."""
    j, binary = _read_glb(path)
    moments = []
    for mesh in j.get("meshes", []):
        for prim in mesh["primitives"]:
            corners = _accessor(j, binary, prim["indices"]).ravel()
            for key in sorted(prim["attributes"]):
                values = _accessor(j, binary, prim["attributes"][key]).astype(np.float64)[corners]
                moments.append((key, np.concatenate([values.sum(0), (values ** 2).sum(0)])))
    images = []
    for img in j.get("images", []):
        view = j["bufferViews"][img["bufferView"]]
        start = view.get("byteOffset", 0)
        images.append(binary[start:start + view["byteLength"]])
    return j, moments, images


def _structure(j):
    """The glTF minus its buffer bookkeeping, which changes when near-identical vertices merge
    differently."""
    out = {k: v for k, v in j.items() if k not in ("accessors", "bufferViews", "buffers", "meshes")}
    out["meshes"] = [
        (m["name"], [(sorted(p["attributes"]), p.get("material"), p.get("mode")) for p in m["primitives"]])
        for m in j.get("meshes", [])
    ]
    return out


# Smooth normals carry float noise from Blender's threaded normal calculation (about 1e-3 summed over a
# few thousand corners); they follow from the positions, which are compared tightly.
TOLERANCE = {"NORMAL": 1e-2}


def same_asset(a, b, tol=1e-5):
    ja, ma, ia = _fingerprint(a)
    jb, mb, ib = _fingerprint(b)
    return (_structure(ja) == _structure(jb) and ia == ib and len(ma) == len(mb)
            and all(ka == kb and np.allclose(x, y, rtol=0, atol=TOLERANCE.get(ka, tol))
                    for (ka, x), (kb, y) in zip(ma, mb)))
