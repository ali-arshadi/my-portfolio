"""Low-profile tenkeyless keyboard: slim case plus 87 keycaps merged into one mesh -> keyboard.glb

The reference board is a low-profile one: short flat caps with small printed legends, close together on
a thin case whose rounded front edge catches the lamp. The legends come from one atlas
(shared/textures.py), and each cap's top face is mapped onto its own cell.

Local frame: origin at the centre of the case base, +y toward the viewer (space bar side), +x to the
viewer's left (Esc side). Key positions are in key units (u) from the left edge of each row.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402  (must load before bmesh/mathutils)
import bmesh  # noqa: E402

from config import KEYBOARD  # noqa: E402
from shared import materials, textures  # noqa: E402
from shared.geometry import add_lightmap_uv, assign, bevel, box, empty, join  # noqa: E402

NAME = "keyboard"
EXPECT = dict(
    names=["keyboard_case", "keyboard_keys"],
    bounds=((-0.66, 0.6, KEYBOARD["center"].z - 0.002), (-0.24, 0.82, KEYBOARD["center"].z + 0.05)),
    max_tris=16000,
)

U = 0.019  # key pitch
GAP = 0.0021  # space between neighbouring caps
MARGIN = 0.007  # case border around the keys
CASE_H = 0.012
PLATE_DROP = 0.0015  # the key plate sits this far below the case rim
CAP_H = 0.0045  # low-profile caps
NAV = 15.25  # navigation cluster starts here

# (row offset from the back in u, [(start u, width u, legend), ...])
ROWS = [
    (0, [(0, 1, "Esc")] + [(2 + i, 1, f"F{i + 1}") for i in range(4)] + [(6.5 + i, 1, f"F{i + 5}") for i in range(4)]
     + [(11 + i, 1, f"F{i + 9}") for i in range(4)]
     + [(NAV + i, 1, t) for i, t in enumerate(["PrtSc", "ScrLk", "Pause"])]),
    (1.5, [(i, 1, t) for i, t in enumerate("`1234567890-=")] + [(13, 2, "Backspace")]
     + [(NAV + i, 1, t) for i, t in enumerate(["Ins", "Home", "PgUp"])]),
    (2.5, [(0, 1.5, "Tab")] + [(1.5 + i, 1, t) for i, t in enumerate("QWERTYUIOP[]")] + [(13.5, 1.5, "\\")]
     + [(NAV + i, 1, t) for i, t in enumerate(["Del", "End", "PgDn"])]),
    (3.5, [(0, 1.75, "Caps")] + [(1.75 + i, 1, t) for i, t in enumerate("ASDFGHJKL;'")] + [(12.75, 2.25, "Enter")]),
    (4.5, [(0, 2.25, "Shift")] + [(2.25 + i, 1, t) for i, t in enumerate("ZXCVBNM,./")] + [(12.25, 2.75, "Shift"),
                                                                                         (NAV + 1, 1, "↑")]),
    (5.5, [(0, 1.25, "Ctrl"), (1.25, 1.25, "Win"), (2.5, 1.25, "Alt"), (3.75, 6.25, ""), (10, 1.25, "Alt"),
           (11.25, 1.25, "Fn"), (12.5, 1.25, "Menu"), (13.75, 1.25, "Ctrl")]
     + [(NAV + i, 1, t) for i, t in enumerate("←↓→")]),
]
COLS = NAV + 3
DEPTH_U = 6.5


def keycap(name, width_u, loc, m, cell):
    """A low-profile cap: slightly tapered sides, softly rounded edges, and its top face mapped onto
    legend atlas cell `cell` (the sides use the atlas' blank cell)."""
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = (width_u * U - GAP, U - GAP, CAP_H)
    bpy.ops.object.transform_apply(scale=True)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    inset = 0.0009
    for v in bm.verts:
        if v.co.z > 0:
            v.co.x -= inset if v.co.x > 0 else -inset
            v.co.y -= inset if v.co.y > 0 else -inset
    bm.to_mesh(o.data)
    bm.free()
    bevel(o, 0.0009, 2)

    me = o.data
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    u0, v0, s = textures.keycap_cell(cell)
    bu, bv, bs = textures.keycap_cell(textures.KEYCAP_GRID ** 2 - 1)
    uv = me.uv_layers[0]
    for p in me.polygons:
        top = p.normal.z > 0.95
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            if top:
                # read left to right as seen from the viewer (toward -x), top of the text at the back (-y)
                uv.data[li].uv = (u0 + s * (x1 - co.x) / (x1 - x0), v0 + s * (y1 - co.y) / (y1 - y0))
            else:
                uv.data[li].uv = (bu + bs / 2, bv + bs / 2)
    o.location = loc
    assign(o, m)
    return o


def build():
    keys_flat = [(t, w) for _, row in ROWS for _, w, t in row]
    textures.keycaps(os.path.join(materials.TEX_DIR, "keycaps.png"), keys_flat)

    c = KEYBOARD["center"]
    root = empty(NAME, c, (0, 0, KEYBOARD["yaw"]))
    width, depth = COLS * U + 2 * MARGIN, DEPTH_U * U + 2 * MARGIN
    shell = box("case_shell", (width, depth, CASE_H), (0, 0, CASE_H / 2), materials.get("keyboard_case"),
                bev=0.004)
    # the darker plate the switches sit in, a little below the rim, so the rim reads as a thin bezel
    plate = box("case_plate", (width - 2 * MARGIN + 0.003, depth - 2 * MARGIN + 0.003, 0.002),
                (0, 0, CASE_H - PLATE_DROP), materials.get("keyboard_plate"))
    case = join("keyboard_case", [shell, plate])
    case.parent = root

    key = materials.get("keyboard_key")
    left, back = width / 2 - MARGIN, -depth / 2 + MARGIN
    caps = []
    for offset, row in ROWS:
        y = back + (offset + 0.5) * U
        for start, w, _label in row:
            x = left - (start + w / 2) * U
            caps.append(keycap(f"key_{len(caps)}", w, (x, y, CASE_H - PLATE_DROP + 0.002 + CAP_H / 2), key,
                               len(caps)))
    keys = join("keyboard_keys", caps)
    keys.parent = root

    # rear feet tilt the board; lift it so the front edge rests on the desk
    root.rotation_euler = (-KEYBOARD["tilt"], 0, KEYBOARD["yaw"])
    root.location.z = c.z + (depth / 2) * KEYBOARD["tilt"]

    add_lightmap_uv(case)
    add_lightmap_uv(keys, margin=0.005)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
