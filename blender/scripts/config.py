"""Layout knobs for the whole workspace. Metres, Blender axes (Z up).

The back wall is the plane y=0 (room interior is y>0). The left wall, which is on the left of the
opening frame, is the plane x=LEFT_WALL_X (room interior is x<LEFT_WALL_X). The glTF exporter turns
(x, y, z) into three.js (x, z, -y); see docs/architecture.md.
"""
import math

import bpy  # noqa: F401  (the bpy module provides mathutils)
from mathutils import Matrix, Vector

# ------------------------------------------------------------------- room --
# Places the wall corner just right of the poster (u ~ 0.22 in the reference).
LEFT_WALL_X = 0.9
ROOM = dict(
    height=2.5,
    wall_thickness=0.1,
    back_wall_x=(-3.2, LEFT_WALL_X + 0.1),  # back wall spans this x range
    left_wall_y=(0.0, 2.8),  # left wall spans this y range
    floor_x=(-3.5, LEFT_WALL_X + 0.1),  # stops at the outside of the left wall
    floor_y=(-0.1, 5.0),
)

# ------------------------------------------------------------------- desk --
DESK_Z = 0.76
DESK = dict(
    x=(-2.5, LEFT_WALL_X),  # runs into the left wall
    depth=1.05,  # front edge passes just below the lamp pool's lower edge in the reference
    thickness=0.04,
    leg=0.04,
    leg_inset=0.1,
)

# ---------------------------------------------------------------- monitor --
MONITOR = dict(
    pos=Vector((-0.47, 0.472, DESK_Z)),
    # Positive = facing toward -x. The poster's vanishing point puts the left wall 15.3 deg off the
    # monitor's own axes, so the monitor is turned this far relative to the back wall.
    yaw=math.radians(-10.4),
    screen_size=(0.64, 0.36),
    screen_center=Vector((0.0, 0.0115, 0.32)),  # in monitor space; set by the desk-height solve
)

# Placements below come from `python -I scripts/calibration.py`, which back-projects points measured
# in the reference through the solved camera. Sizes are real-world product sizes that those points
# confirmed (e.g. the keyboard measures 0.368 x 0.148 m, a tenkeyless board).

MONITOR_STAND = dict(
    base_size=(0.30, 0.21, 0.010),
    base_front=0.045,  # base front edge, in front of the panel (measured 0.035-0.07 m)
)

# --------------------------------------------------------------- keyboard --
KEYBOARD = dict(
    center=Vector((-0.448, 0.711, DESK_Z)),
    yaw=math.radians(-2.3),
    tilt=math.radians(3),  # back raised on its feet
)

# ------------------------------------------------------------------ mouse --
# Not in the reference: added by the owner. Just right of the keyboard (viewer's right is -x), level
# with its middle row, turned a little toward the hand.
MOUSE = dict(pos=Vector((-0.74, 0.725, DESK_Z)), yaw=math.radians(-8))

# ------------------------------------------------------------------- lamp --
# Elbow and head are assumed to sit at the base's distance from the back wall (one view cannot fix it).
LAMP = dict(
    base=Vector((0.246, 0.429, DESK_Z)),
    elbow=Vector((0.354, 0.429, 0.935)),
    head=Vector((0.102, 0.429, 1.044)),  # centre of the dish rim
    dish_normal=Vector((-0.709, 0.145, -0.690)),  # from the rim's ellipse
    dish_diameter=0.226,
    # where the light is aimed: the measured pool centre (0.33, 0.75), pushed a little further out so the
    # bright part is not all next to the base (light falls off with distance from the bulb)
    pool=Vector((-0.24, 0.78, DESK_Z)),
)

# ---------------------------------------------------------------- poster --
POSTER = dict(
    center=Vector((LEFT_WALL_X, 0.379, 1.244)),  # on the wall, centre of the frame opening
    opening=(0.427, 0.625),  # frame's inner opening (width along the wall, height)
    frame_border=0.035,
    frame_depth=0.03,
    mat_width=0.035,
)

# ----------------------------------------------------------------- shelf --
SHELF = dict(
    x=(-0.477, 0.452),
    depth=0.20,
    top=1.365,
    thickness=0.038,
)

# Depths (distance from the back wall) of the things on the shelf. The image cannot fix these, since
# their bases are hidden behind the shelf's front edge; x and height come from calibration.py.
SHELF_PROPS = dict(
    book_front=0.18,
    figurine_y=0.10,
    candle_y=0.12,
    shelf_plant_pot_y=0.10,
)

# Books left to right as seen from the camera (x falls to the right). Centre x, thickness and height
# come from calibration.py; titles are programming topics, and the reference's third spine is light.
BOOKS = [
    dict(x=0.347, thickness=0.052, height=0.236, title="Vue.js", cover="#16171a"),
    dict(x=0.292, thickness=0.057, height=0.235, title="Node.js", cover="#1b1b1f"),
    dict(x=0.244, thickness=0.040, height=0.226, title="CSS", cover="#c9c5bd"),
    dict(x=0.199, thickness=0.049, height=0.221, title="Next.js", cover="#121214"),
    dict(x=0.151, thickness=0.048, height=0.213, title="Nuxt", cover="#1e1d21"),
    dict(x=0.109, thickness=0.037, height=0.193, title="JavaScript", cover="#18171a"),
    dict(x=0.070, thickness=0.040, height=0.185, title="Git", cover="#201e1c"),
    dict(x=0.033, thickness=0.032, height=0.195, title="TypeScript", cover="#141518"),
]
BOOK_DEPTH = 0.15

FIGURINE = dict(x=-0.065, height=0.111)
CANDLE = dict(x=-0.134, height=0.056)
SHELF_PLANT = dict(x=-0.391, pot_height=0.089, pot_radius=0.043)

# The floor plant stands on the desk; calibration.py solves its pot from its silhouette in 3D.
FLOOR_PLANT = dict(pos=Vector((-1.105, 0.230, DESK_Z)), pot_radius=0.094, pot_height=0.119)

# ----------------------------------------------------------------- camera --
# Solved from the four screen corners in docs/reference/reference.webp (1 px residual), assuming the
# 0.64 x 0.36 m screen below, then turned with the monitor to match the poster's vanishing point, then
# lowered with the monitor so the keyboard and stand base land at real sizes on the desk.
# See docs/visual-specification.md section 5.
CAMERA = dict(
    pos=Vector((-1.082, 1.726, 1.322)),
    yaw=math.radians(298.96),
    pitch=math.radians(12.37),  # downward
    lens=27.0,
    sensor_width=36.0,
    aspect=16 / 9,
)
# Fraction of the frame width the screen fills at the end of the scroll.
SCREEN_FILL = 0.85


def camera_target(distance=3.0):
    c = CAMERA
    d = Vector((
        math.cos(c["pitch"]) * math.cos(c["yaw"]),
        math.cos(c["pitch"]) * math.sin(c["yaw"]),
        -math.sin(c["pitch"]),
    ))
    return c["pos"] + distance * d


def vertical_fov_deg():
    c = CAMERA
    half_w = c["sensor_width"] / 2 / c["lens"]
    return math.degrees(2 * math.atan(half_w / c["aspect"]))


def screen_camera():
    """Camera square-on to the monitor screen, far enough back that it fills SCREEN_FILL of the width."""
    m = MONITOR
    turn = Matrix.Rotation(m["yaw"], 3, "Z")
    center = m["pos"] + turn @ m["screen_center"]
    normal = turn @ Vector((0, 1, 0))
    half_w = CAMERA["sensor_width"] / 2 / CAMERA["lens"]
    distance = m["screen_size"][0] / SCREEN_FILL / 2 / half_w
    return center + normal * distance, center
