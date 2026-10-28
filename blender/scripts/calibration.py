"""Turns pixel measurements of docs/reference/reference.webp into 3D placements.

    python -I scripts/calibration.py

Each anchor is a point measured in the reference (pixels at 1672 x 941). A ray from the solved camera
through that pixel is intersected with a known plane (desk top, left wall, a depth from the back wall),
which gives the 3D point. The printed values are what config.py uses; rerun this after changing the
camera or an anchor, and copy the results across.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config as C  # noqa: E402
from mathutils import Vector  # noqa: E402

W, H = 1672, 941

# Pixel anchors, measured from luminance profiles and zoomed crops (see docs/visual-specification.md).
ANCHORS = {
    # keyboard case, bottom edges on the desk (front) and top edge at the back
    "keyboard_front_left": (630, 752),
    "keyboard_front_right": (905, 826),
    "keyboard_back_left": (640, 668),
    "keyboard_back_right": (962, 752),
    # lamp
    "lamp_base_top_center": (475, 571),
    "lamp_elbow": (415, 461),
    "lamp_head_rim_center": (540, 402),
    # the dish rim's image ellipse: full major axis as a vector (px) and minor/major ratio
    "lamp_rim_major_axis": (135, -85),
    "lamp_rim_ratio": (0.47, 0),
    # poster: the mat's outer boundary (the frame's inner opening)
    "poster_mat_top_left": (74, 34),
    "poster_mat_top_right": (311, 64),
    "poster_mat_bottom_left": (74, 450),
    "poster_mat_bottom_right": (311, 413),
    # shelf front face
    "shelf_front_top_left": (462, 174),
    "shelf_front_top_right": (1002, 154),
    "shelf_front_bottom_left": (462, 196),
    "shelf_front_bottom_right": (1002, 187),
    # monitor stand base, front edge on the desk
    "stand_front_left": (790, 668),
    "stand_front_mid": (960, 722),
    # centre of the lamp's light pool on the desk
    "lamp_pool_center": (552, 706),
    # shelf props: bottom centre on the shelf top, and top
    "figurine_bottom": (767, 160),
    "figurine_top": (767, 88),
    "candle_bottom": (800, 160),
    "candle_top": (800, 125),
    "shelf_plant_pot_bottom": (970, 160),
    "shelf_plant_pot_top": (970, 95),
    # floor plant (it stands on the desk): the pot's lowest point (its front-bottom), its left and right
    # silhouette edges, and the top of its rim ellipse (the rim's back edge)
    "floor_plant_pot_bottom": (1522, 750),
    "floor_plant_pot_left": (1425, 670),
    "floor_plant_pot_right": (1620, 670),
    "floor_plant_pot_rim_back": (1522, 590),
}

# Book spines, left to right: (left x, right x, top y). They all stand on the shelf at y = 165 px.
# The dark block right of the last spine is that book's side cover seen at an angle, not another book.
BOOK_SPINES = [(507, 532, 10), (532, 560, 8), (560, 580, 12), (580, 605, 14), (605, 630, 17),
               (630, 650, 30), (650, 672, 34), (672, 690, 25)]
BOOK_BOTTOM_Y = 165


def ray(px, py):
    c = C.CAMERA
    rot = (C.camera_target() - c["pos"]).to_track_quat("-Z", "Y").to_matrix()
    f = c["lens"] / c["sensor_width"] * W
    return c["pos"].copy(), (rot @ Vector(((px - W / 2) / f, -(py - H / 2) / f, -1))).normalized()


def project(p):
    """World point -> reference pixel."""
    c = C.CAMERA
    rot = (C.camera_target() - c["pos"]).to_track_quat("-Z", "Y").to_matrix()
    f = c["lens"] / c["sensor_width"] * W
    q = rot.transposed() @ (p - c["pos"])
    return W / 2 + f * q.x / -q.z, H / 2 - f * q.y / -q.z


def hit(px, py, axis, value):
    """Intersect the ray through (px, py) with the plane `axis` = value (axis 0=x, 1=y, 2=z)."""
    o, d = ray(px, py)
    t = (value - o[axis]) / d[axis]
    return o + d * t


def pixel_size(point):
    """Metres per pixel at `point` (perpendicular to the view)."""
    f = C.CAMERA["lens"] / C.CAMERA["sensor_width"] * W
    return (point - C.CAMERA["pos"]).length / f


def dish(center, major_px, ratio):
    """A circle seen as an ellipse: its normal leans away from the view by acos(ratio), toward the
    minor axis. Of the two minor-axis directions, the one pointing down the image is used (the lamp
    lights the desk), and the normal faces the camera because the bright interior is visible."""
    c = C.CAMERA
    rot = (C.camera_target() - c["pos"]).to_track_quat("-Z", "Y").to_matrix()
    right, up = rot @ Vector((1, 0, 0)), rot @ Vector((0, 1, 0))
    mx, my = major_px
    minor = Vector((-my, mx)).normalized()
    if minor.y < 0:
        minor = -minor  # point down the image (image y grows downward)
    in_image = (right * minor.x - up * minor.y).normalized()
    to_camera = (c["pos"] - center).normalized()
    in_image = (in_image - to_camera * in_image.dot(to_camera)).normalized()
    theta = math.acos(ratio)
    normal = to_camera * math.cos(theta) + in_image * math.sin(theta)
    diameter = math.hypot(mx, my) * pixel_size(center)
    return normal.normalized(), diameter


def fmt(v):
    return "(" + ", ".join(f"{c:.3f}" for c in v) + ")"


def main():
    a = ANCHORS
    z = C.DESK_Z

    print("keyboard (front corners on the desk, back corners at the case top, z + 0.025)")
    fl, fr = hit(*a["keyboard_front_left"], 2, z), hit(*a["keyboard_front_right"], 2, z)
    bl, br = hit(*a["keyboard_back_left"], 2, z + 0.025), hit(*a["keyboard_back_right"], 2, z + 0.025)
    for k, v in dict(front_left=fl, front_right=fr, back_left=bl, back_right=br).items():
        print(f"  {k:12s} {fmt(v)}")
    width = ((fr - fl).length + (br - bl).length) / 2
    depth = ((bl - fl).length + (br - fr).length) / 2
    along = (fr - fl) + (br - bl)
    yaw = math.degrees(math.atan2(along.y, along.x))
    print(f"  centre {fmt((fl + fr + bl + br) / 4)}  width {width:.3f}  depth {depth:.3f}  yaw {yaw:.1f} deg")

    print("lamp (elbow and head assumed at the base's distance from the back wall)")
    base = hit(*a["lamp_base_top_center"], 2, z + 0.02)
    print(f"  base centre {fmt(base)}")
    for name in ("lamp_elbow", "lamp_head_rim_center"):
        p = hit(*a[name], 1, base.y)
        print(f"  {name} at the base's depth {fmt(p)}  ({pixel_size(p) * 1000:.2f} mm/px)")
    head = hit(*a["lamp_head_rim_center"], 1, base.y)
    normal, diameter = dish(head, a["lamp_rim_major_axis"], a["lamp_rim_ratio"][0])
    print(f"  dish diameter {diameter:.3f}, opening faces {fmt(normal)}")
    t = (head.z - z) / -normal.z
    print(f"  dish axis meets the desk at {fmt(head + normal * t)}; "
          f"measured pool centre {fmt(hit(*a['lamp_pool_center'], 2, z))}")

    print("poster mat corners on the left wall (x = LEFT_WALL_X - 0.03)")
    x = C.LEFT_WALL_X - 0.03
    pts = {k: hit(*a[f"poster_mat_{k}"], 0, x) for k in ("top_left", "top_right", "bottom_left", "bottom_right")}
    for k, v in pts.items():
        print(f"  {k:12s} {fmt(v)}")
    w = ((pts["top_left"] - pts["top_right"]).length + (pts["bottom_left"] - pts["bottom_right"]).length) / 2
    h = ((pts["top_left"] - pts["bottom_left"]).length + (pts["top_right"] - pts["bottom_right"]).length) / 2
    centre = sum(pts.values(), Vector()) / 4
    print(f"  opening {w:.3f} x {h:.3f}, centre {fmt(centre)}")

    print("shelf front face, for a range of shelf depths")
    for depth in (0.18, 0.2, 0.22, 0.25):
        tl, tr = hit(*a["shelf_front_top_left"], 1, depth), hit(*a["shelf_front_top_right"], 1, depth)
        bl_, br_ = hit(*a["shelf_front_bottom_left"], 1, depth), hit(*a["shelf_front_bottom_right"], 1, depth)
        print(f"  depth {depth}: x {tl.x:.3f}..{tr.x:.3f}  top z {tl.z:.3f}/{tr.z:.3f}  "
              f"bottom z {bl_.z:.3f}/{br_.z:.3f}")

    # The camera sits below the shelf top, so the shelf's top face and the bases of everything on it are
    # hidden behind its front edge. Project onto vertical planes at a chosen depth on the shelf instead;
    # that gives x and height, which is what the image constrains.
    shelf_top = C.SHELF["top"]
    print("books (spines at y = SHELF_PROPS['book_front'])")
    yb = C.SHELF_PROPS["book_front"]
    for i, (x0, x1, top) in enumerate(BOOK_SPINES):
        left, right = hit(x0, BOOK_BOTTOM_Y, 1, yb), hit(x1, BOOK_BOTTOM_Y, 1, yb)
        height = hit((x0 + x1) / 2, top, 1, yb).z - shelf_top
        print(f"  book_{i}: centre x {(left.x + right.x) / 2:.3f}, thickness {left.x - right.x:.3f}, "
              f"height {height:.3f}")

    print("shelf props (centre depths from SHELF_PROPS)")
    for name in ("figurine", "candle", "shelf_plant_pot"):
        y = C.SHELF_PROPS[f"{name}_y"]
        top = hit(*a[f"{name}_top"], 1, y)
        print(f"  {name}: centre x {hit(*a[f'{name}_bottom'], 1, y).x:.3f}, height {top.z - shelf_top:.3f}, "
              f"{pixel_size(top) * 1000:.2f} mm/px")

    print("floor plant (on the desk)")
    # Near the frame edge the wide lens stretches things sideways, so solve the pot in 3D rather than
    # converting pixels to metres: pick the radius whose silhouette is as wide as measured, shift x until
    # it is centred, then raise the rim until its back edge reaches the measured pixel.
    front = hit(*a["floor_plant_pot_bottom"], 2, z)
    want_w = a["floor_plant_pot_right"][0] - a["floor_plant_pot_left"][0]
    want_mid = (a["floor_plant_pot_right"][0] + a["floor_plant_pot_left"][0]) / 2

    def sides(x, r):
        lo = project(Vector((x + r, front.y - r, z + 0.1)))[0]
        hi = project(Vector((x - r, front.y - r, z + 0.1)))[0]
        return lo, hi

    x, r = front.x, 0.1
    for _ in range(20):
        r = min((i / 1000 for i in range(40, 200)), key=lambda rr: abs(abs(sides(x, rr)[1] - sides(x, rr)[0]) - want_w))
        lo, hi = sides(x, r)
        x += ((lo + hi) / 2 - want_mid) * pixel_size(front)
    h = next(i / 1000 for i in range(50, 400)
             if project(Vector((x, front.y - 2 * r, z + i / 1000)))[1] <= a["floor_plant_pot_rim_back"][1])
    print(f"  pot centre ({x:.3f}, {front.y - r:.3f}), radius {r:.3f}, rim height {h:.3f}")

    print("monitor stand base front edge on the desk")
    s0, s1 = hit(*a["stand_front_left"], 2, z), hit(*a["stand_front_mid"], 2, z)
    d = s1 - s0
    print(f"  {fmt(s0)} -> {fmt(s1)}, direction {math.degrees(math.atan2(d.y, d.x)):.1f} deg "
          f"(monitor yaw {math.degrees(C.MONITOR['yaw']):.1f})")


if __name__ == "__main__":
    main()
