"""Monitor panel, housing and stand -> monitor.glb

Local frame: origin on the desk under the panel centre, +y toward the viewer, rotated by MONITOR["yaw"].
The panel sits low over its base (no neck is visible in the reference), so the neck hides behind it.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import MONITOR, MONITOR_STAND  # noqa: E402
from shared import materials  # noqa: E402
from shared.geometry import add_lightmap_uv, box, descendants, empty, plane  # noqa: E402

NAME = "monitor"
EXPECT = dict(
    names=["monitor_panel", "monitor_back", "monitor_hinge", "monitor_neck", "monitor_base", "monitor_led", "Screen"],
    bounds=((-0.9, 0.2, MONITOR["pos"].z - 0.001), (0.0, 0.8, MONITOR["pos"].z + 0.6)),
    max_tris=3000,
)

# Thin, even bezels with a slightly deeper chin, as on the reference's panel.
BEZEL = dict(side=0.008, top=0.008, bottom=0.012, thickness=0.012)
BODY_DEPTH = 0.028  # the housing behind the bezel, which shows at the panel's sides


def build():
    root = empty(NAME, MONITOR["pos"], (0, 0, MONITOR["yaw"]))
    bezel, plastic = materials.get("monitor_bezel"), materials.get("monitor_plastic")
    sw, sh = MONITOR["screen_size"]
    sc = MONITOR["screen_center"]

    pw, ph = sw + 2 * BEZEL["side"], sh + BEZEL["top"] + BEZEL["bottom"]
    pz = sc.z + (BEZEL["top"] - BEZEL["bottom"]) / 2
    t = BEZEL["thickness"]
    box("monitor_panel", (pw, t, ph), (0, sc.y - 0.0015 - t / 2, pz), bezel, bev=0.004, parent=root)
    # the housing: as wide and tall as the panel, with softly rounded edges; its side catches the cool
    # rim light down the panel's right edge, as in the reference
    box("monitor_back", (pw - 0.004, BODY_DEPTH, ph - 0.004), (0, sc.y - t - BODY_DEPTH / 2 + 0.002, pz), plastic,
        bev=0.008, parent=root)
    box("monitor_hinge", (0.10, 0.03, 0.07), (0, sc.y - t - BODY_DEPTH - 0.012, sc.z - 0.03), plastic, bev=0.008,
        parent=root)

    # a wide, flat base plate, the only part of the stand the reference shows
    bw, bd, bt = MONITOR_STAND["base_size"]
    base_y = sc.y + MONITOR_STAND["base_front"] - bd / 2
    box("monitor_base", (bw, bd, bt), (0, base_y, bt / 2), materials.get("monitor_stand"), bev=0.004, parent=root)
    neck_top = sc.z - 0.03
    # in the bezel's near-black so the strip that shows under the panel reads as shadow
    box("monitor_neck", (0.06, 0.016, neck_top - bt), (0, sc.y - t - BODY_DEPTH - 0.02, (bt + neck_top) / 2), bezel,
        bev=0.004, parent=root)

    # a small power light on the chin, bottom right as seen from the front
    box("monitor_led", (0.003, 0.001, 0.0012), (-pw / 2 + 0.03, sc.y - 0.0012, pz - ph / 2 + BEZEL["bottom"] / 2),
        materials.get("monitor_led"), parent=root)

    # the site anchors its HTML to this node; it starts out with a placeholder image
    plane("Screen", sw, sh, sc, materials.get("monitor_screen"), facing="+y", parent=root)

    for o in descendants(root):
        if o.type == "MESH":
            add_lightmap_uv(o)
    return root


if __name__ == "__main__":
    from build_scene import run_single
    run_single(build, EXPECT)
