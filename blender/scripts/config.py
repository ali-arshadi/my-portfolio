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
    depth=0.95,  # front edge passes just below the lamp pool's lower edge in the reference
    thickness=0.04,
    leg=0.04,
    leg_inset=0.1,
)

# ---------------------------------------------------------------- monitor --
# Built in Phase 2; the screen camera below already depends on it.
MONITOR = dict(
    pos=Vector((-0.47, 0.472, DESK_Z)),
    # Positive = facing toward -x. The poster's vanishing point puts the left wall 15.3 deg off the
    # monitor's own axes, so the monitor is turned this far relative to the back wall.
    yaw=math.radians(-10.4),
    screen_size=(0.64, 0.36),
    screen_center=Vector((0.0, 0.0115, 0.46)),  # in monitor space
)

# ----------------------------------------------------------------- camera --
# Solved from the four screen corners in docs/reference/reference.webp (1 px residual), assuming the
# 0.64 x 0.36 m screen below, then turned with the monitor to match the poster's vanishing point.
# See docs/visual-specification.md section 5.
CAMERA = dict(
    pos=Vector((-1.082, 1.726, 1.462)),
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
