# Visual specification

Source of truth: [`reference/reference.webp`](reference/reference.webp) (1672 × 941, 16:9).
[`reference/reference-grid.png`](reference/reference-grid.png) is the same image with a 0.05 grid; every
coordinate below was read off it.

All image coordinates are normalised: `(u, v)`, origin top-left, `u` to the right, `v` down, both 0–1.
Boxes are `u0, v0 → u1, v1`. They are measured from one perspective image, so they are targets for the
opening frame, not physical dimensions.

The small "N" circle at `0.01, 0.95 → 0.03, 0.99` is the Next.js dev-mode indicator captured in the
screenshot. It is not part of the design.

---

## 1. Object inventory and image-space bounds

| #   | Object                         | Box (u0, v0 → u1, v1)                                      | Notes                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Left wall                      | 0 → ≈ 0.22, full height                                    | Receives the poster. The corner itself is not visible (it is dark and partly behind the lamp head); it must lie just right of the poster frame, and the calibrated room puts it at `u ≈ 0.22`. The vertical edge at `u ≈ 0.326` is where the shelf LED's wash on the back wall begins, **not** the corner (corrected in Phase 1). |
| A   | Back wall                      | ≈ 0.22 → 1, `v 0 → 0.58–0.84`                              | Darkest at upper right (`#05070d`), warm wash under the shelf.                                                                                                                                                                                                                                                                    |
| A   | Desk top                       | full width, `v ≈ 0.57 → 1`                                 | Back edge meets the back wall around `v 0.57–0.60`. Front edge is out of frame.                                                                                                                                                                                                                                                   |
| E   | Poster frame (outer)           | 0.03, 0.02 → 0.195, 0.49                                   | Left edge taller than right: the left wall recedes toward the corner.                                                                                                                                                                                                                                                             |
| E   | Poster text block              | 0.085, 0.15 → 0.16, 0.35                                   | Four left-aligned lines, monospace bold. Short underline at `0.10–0.125, v 0.40`.                                                                                                                                                                                                                                                 |
| F   | Floating shelf board           | 0.28, 0.165 → 0.60, 0.21                                   | Front edge nearly horizontal: it is at the camera's eye height (see §5).                                                                                                                                                                                                                                                          |
| F   | Shelf LED spill on wall        | 0.33, 0.20 → 0.60, 0.30                                    | Warm gradient fading downward.                                                                                                                                                                                                                                                                                                    |
| G   | Books                          | 0.305, 0.01 → 0.415, 0.18                                  | 7 upright spines, slight height variation; spine labels vertical and only partly legible.                                                                                                                                                                                                                                         |
| H   | Figurine                       | 0.44, 0.095 → 0.475, 0.165                                 | Small dark cat-like collectible with a round head.                                                                                                                                                                                                                                                                                |
| —   | Candle (accent light)          | 0.47, 0.125 → 0.487, 0.165                                 | Small cup with a bright flame (`#fffedc`).                                                                                                                                                                                                                                                                                        |
| I   | Shelf plant                    | pot 0.56, 0.10 → 0.60, 0.165; foliage 0.51, 0 → 0.67, 0.25 | Heart-shaped leaves, vines spilling over the shelf edge down to `v ≈ 0.25`.                                                                                                                                                                                                                                                       |
| B   | Monitor panel (outer)          | 0.405, 0.245 → 0.718, 0.67                                 | Right edge (~0.41 tall) is longer than the left (~0.31): the right side is nearer the camera.                                                                                                                                                                                                                                     |
| B   | Screen active area             | 0.411, 0.264 → 0.699, 0.667                                | Exact corners measured in §5.                                                                                                                                                                                                                                                                                                     |
| B   | Monitor stand base             | 0.47, 0.67 → 0.60, 0.76                                    | Low, dark, partly hidden by the keyboard. **No tall neck is visible**: the panel sits low over its base.                                                                                                                                                                                                                          |
| B   | Cool rim on monitor right edge | 0.712, 0.25 → 0.72, 0.31                                   | Thin blue highlight (`#203677`).                                                                                                                                                                                                                                                                                                  |
| D   | Lamp head (dish)               | 0.275, 0.365 → 0.365, 0.49                                 | Ellipse whose opening faces the camera and slightly right; glowing interior (`#fef9e8` centre).                                                                                                                                                                                                                                   |
| D   | Lamp arm + spring              | 0.245, 0.48 → 0.29, 0.59                                   | Joint at `(0.245, 0.485)`, coil spring along the lower arm.                                                                                                                                                                                                                                                                       |
| D   | Lamp base                      | 0.25, 0.585 → 0.32, 0.64                                   | Round disc; cable leaves toward `(0.28, 0.665)`.                                                                                                                                                                                                                                                                                  |
| C   | Keyboard                       | 0.345, 0.705 → 0.60, 0.89                                  | Long axis runs from `(0.38, 0.71)` to `(0.59, 0.86)`. Compact layout with arrow cluster at lower right.                                                                                                                                                                                                                           |
| J   | Floor/desk plant               | leaves 0.78, 0.27 → 1.0, 0.66; pot 0.85, 0.62 → 0.97, 0.80 | Sword-shaped leaves, mostly in silhouette. Pot is a plain warm-grey cylinder.                                                                                                                                                                                                                                                     |
| —   | Lamp light pool on desk        | ellipse ≈ 0.15, 0.62 → 0.55, 0.95, centre ≈ (0.33, 0.75)   | The brightest large area in the frame (`#724219` mid-pool).                                                                                                                                                                                                                                                                       |
| L   | Hero heading "Ali Arshadi"     | 0.034, 0.715 → 0.378, 0.815                                | HTML overlay (see §11).                                                                                                                                                                                                                                                                                                           |

### Screen content (inside the active area)

| Element                        | Box                       | Notes                                                                         |
| ------------------------------ | ------------------------- | ----------------------------------------------------------------------------- |
| Window dots                    | 0.42 → 0.435, `v ≈ 0.282` | Red, amber, green.                                                            |
| Code lines                     | 0.425, 0.31 → 0.54, 0.56  | ~19 rounded bars, mixed widths and indents; blue, violet, amber, green, grey. |
| Name                           | 0.556, 0.42 → 0.652, 0.47 | Bold sans, near-white (`#f7ffff`).                                            |
| Subtitle "Front-end developer" | 0.556, 0.47 → 0.63, 0.49  | Smaller, muted blue-grey.                                                     |

---

## 2. Relative sizes

Physical sizes used by the Blender scene. The room and desk are calibrated (Phase 1); the rest come
from the legacy scene and are re-placed against the solved camera in Phases 2–3.

| Object          | Size (m)                                              |
| --------------- | ----------------------------------------------------- |
| Desk top height | 0.76                                                  |
| Desk            | 3.4 wide × 0.95 deep, running into the left wall      |
| Room            | back wall `y = 0`, left wall `x = 0.9` (Blender axes) |
| Monitor screen  | 0.64 × 0.36 (the camera solve's assumption)           |
| Monitor panel   | 0.66 × 0.385 (≈ 27″ 16:9)                             |
| Keyboard        | ≈ 0.33 × 0.15 (75 % layout)                           |
| Poster frame    | ≈ 0.42 × 0.55                                         |
| Shelf           | 1.10 long, top at 1.4655                              |
| Lamp            | head Ø ≈ 0.20, overall ≈ 0.45 tall                    |
| Floor plant     | pot Ø ≈ 0.19, leaves 0.36–0.62                        |

---

## 3. Depth order (near → far)

1. Hero HTML overlay (screen space).
2. Keyboard; right floor plant.
3. Lamp; monitor stand base.
4. Monitor panel (right side nearer than left).
5. Shelf, books, figurine, shelf plant.
6. Poster on the left wall; back wall; wall corner.

---

## 4. Occlusion relationships

- The keyboard overlaps the lower front of the monitor stand base.
- The monitor panel hides the shelf-plant vines below `v ≈ 0.25` and the back wall behind it.
- Shelf-plant leaves overlap the right end of the shelf board and the top-right corner of the monitor.
- The hero heading overlaps the lamp light pool and the left end of the keyboard (`u 0.345–0.378`).
  The overlay must never cover the monitor (`u > 0.405`).
- The lamp head partly occludes the wall corner seam.

---

## 5. Camera

Solved in Phase 1 from measurements, not by eye. The legacy Blender camera (33.6 mm, 10.3° pitch)
was up to 23 px off on the monitor and put the room at the wrong angle.

**Step 1: pose and focal length from the screen.** The screen's four corners were measured in the
reference (pixel coordinates at 1672 × 941):

| Corner       | px              | (u, v)         |
| ------------ | --------------- | -------------- |
| Top-left     | (687.4, 248.0)  | (0.411, 0.264) |
| Top-right    | (1168.4, 259.7) | (0.699, 0.276) |
| Bottom-left  | (695.8, 526.3)  | (0.416, 0.559) |
| Bottom-right | (1153.3, 627.8) | (0.690, 0.667) |

Assuming a 0.64 × 0.36 m (16:9) screen, a least-squares solve over position, orientation and focal
length reproduces all four corners to within **1 px**.

**Step 2: room orientation from the poster.** The poster frame's top and bottom edges meet at a
vanishing point at (1544, 219) px. That is the direction of the left wall's horizontal lines, and it
says the room is turned 15.3° relative to the monitor. The camera and monitor were turned together
around the screen centre, which keeps step 1's fit. Checks after the turn:

- The monitor's own vanishing point (-710, 214) maps to its configured direction within 0.3°.
- The poster's maps to the left wall's direction within 0.01°.
- Both vanishing points lie on the same horizon (`v ≈ 0.23`), so camera roll is ≈ 0.

**Step 3: room extents from what sits on the desk.** The left wall's position puts the corner just right
of the poster (`u ≈ 0.22`). The desk depth (0.95 m) keeps the whole lamp pool on the desk while the
lower-left corner falls off its front edge. The floor plant's pot, measured at `v ≈ 0.80`, now lands on
the desk near the back wall; with the old camera it would have been inside the wall.

| Parameter                         | Value                                                                    |
| --------------------------------- | ------------------------------------------------------------------------ |
| Position (Blender, Z up)          | (-1.082, 1.726, 1.462)                                                   |
| Position (three.js, Y up)         | (-1.082, 1.462, -1.726)                                                  |
| Heading / pitch / roll            | 298.96° / 12.37° down / 0°                                               |
| Lens                              | 27.0 mm on a 36 mm sensor → 67.4° horizontal, 41.1° vertical FOV at 16:9 |
| Height above desk                 | 0.70 m (seated eye height)                                               |
| Distance to screen centre         | 1.41 m                                                                   |
| Monitor yaw relative to back wall | -10.4° (turned slightly away from the camera)                            |

The focal length is wide (≈ 27 mm full-frame equivalent). That explains the strong perspective on the
monitor's right edge and on the keyboard. Straight lines show no lens distortion. The values live in
`blender/scripts/config.py` and reach the site through the generated `src/config/scene.generated.ts`.

---

## 6. Materials

| Surface       | Class                                               | Notes                                                                                       |
| ------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Walls         | Matte dielectric, rough 0.9+                        | Near-black, slightly blue on the right, faint large-scale variation.                        |
| Desk top      | Dark wood, rough ≈ 0.7                              | Grain runs left–right; warm specular sheen only inside the lamp pool.                       |
| Shelf         | Dark wood, slightly lighter than desk               | Thin board with visible front edge.                                                         |
| Monitor shell | Matte black plastic                                 | Thin bezel; faint cool rim on the right edge.                                               |
| Screen        | Emissive                                            | Navy-black gradient, not a flat bright panel.                                               |
| Keyboard      | Dark plastic case, dark keycaps                     | Slight purple-warm reflection from the lamp (`#1c131c`). Individual caps with visible gaps. |
| Lamp          | Dark brushed metal, metallic 1, rough ≈ 0.35        | Interior of the dish is a warm, near-white diffuser. Coiled spring.                         |
| Poster        | Matte print in a dark frame with a lighter mat      | Possible very faint glass reflection.                                                       |
| Books         | Matte paper/cloth spines                            | Mostly black, one or two lighter spines.                                                    |
| Figurine      | Glossy black                                        | Small highlight on the head.                                                                |
| Pots          | Ceramic, matte (shelf: off-white; floor: warm grey) |                                                                                             |
| Foliage       | Dark green, waxy (rough ≈ 0.35)                     | Shelf plant leaves catch the LED (`#f1bc7e` highlights).                                    |

---

## 7. Lighting

| Source                      | Colour (approx.)                  | Relative strength | Effect                                                                                         |
| --------------------------- | --------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| Desk lamp                   | ~2700 K amber (`#ffc690`)         | 1.0 (key)         | Large pool on the desk, warm light on the keyboard, lamp base, lower poster.                   |
| Shelf LED strip (underside) | ~2400 K (`#ffc47f`)               | ≈ 0.5             | Bright line under the shelf, gradient on the wall `v 0.20–0.30`, rim light on books and plant. |
| Candle                      | ~1900 K (`#fffedc` core)          | ≈ 0.05            | Small local glow on the figurine and the books.                                                |
| Monitor                     | Cool blue (`#203677` → `#384366`) | ≈ 0.15            | Faint spill on the keyboard back and desk under the screen; rim on the monitor's right edge.   |
| Environment fill            | Cool (`#07080f`)                  | very low          | Only enough to separate the right plant and right wall from black.                             |

The right third of the frame is almost black. Do not lift it with ambient light.

---

## 8. Foreground / background and major shadows

- **Foreground:** keyboard, lamp pool, floor plant, hero typography.
- **Midground:** monitor, lamp, stand.
- **Background:** walls, shelf group, poster.
- **Shadow masses:** the whole right side `u > 0.72`, the upper right wall, the desk front `v > 0.9`
  outside the pool, beneath the monitor, and the far-left desk corner `u < 0.15, v > 0.65`.
- **Contact shadows:** keyboard on the desk (soft, lamp-cast toward the lower right), lamp base,
  monitor base, floor-plant pot.

---

## 9. Palette

| Role                       | Hex                                                              |
| -------------------------- | ---------------------------------------------------------------- |
| Wall, upper right          | `#05070d`                                                        |
| Wall, left                 | `#0c0b0e`                                                        |
| Wall behind monitor (warm) | `#0e0803`                                                        |
| Shelf LED spill on wall    | `#6f3409`                                                        |
| Desk, outside pool         | `#170e10`                                                        |
| Desk, lamp pool            | `#724219`                                                        |
| Lamp interior              | `#fef9e8`                                                        |
| Screen background          | `#080d24`                                                        |
| Screen name text           | `#f7ffff`                                                        |
| Code line (blue)           | `#98adfe`                                                        |
| Poster background          | `#120a07`                                                        |
| Poster text                | `#c29e8a`                                                        |
| Poster "Repeat."           | `#db945e`                                                        |
| Keyboard                   | `#1c131c`                                                        |
| Hero heading               | `#ffffff`                                                        |
| Hero subtitle              | `#e0e2e6` (rendered smaller and dimmer, effectively ≈ `#9a9ca3`) |
| Scroll hint                | `#fed993`                                                        |
| Far right                  | `#000002`                                                        |

---

## 10. Poster typography

Four lines, left-aligned, monospace bold, tight leading:

```
Build
Ship
Improve
Repeat.
```

The first three lines are light warm grey (`#c29e8a`). "Repeat." is warm orange (`#db945e`).
A short orange rule sits under the block.

---

## 11. Hero typography (HTML overlay)

| Element                                              | Box                         | Size at 941 px viewport height                      | Style                                                      |
| ---------------------------------------------------- | --------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| "Ali Arshadi"                                        | 0.034, 0.715 → 0.378, 0.815 | cap height ≈ 0.10 H (font size ≈ 0.135 H, ≈ 127 px) | Bold geometric grotesk, tight tracking (≈ -0.03 em), white |
| "Front-end developer. Vue, Nuxt, React, TypeScript." | 0.034, 0.845 → 0.277, 0.865 | ≈ 18 px                                             | Regular, muted grey                                        |
| "Scroll to step up to the screen"                    | 0.034, 0.905 → 0.14, 0.92   | ≈ 13 px                                             | Regular, amber `#fed993`                                   |

All three share the left edge `u = 0.034` (≈ 57 px at 1672 wide).

---

## 12. Reconstruction feasibility

**Can be rebuilt procedurally and accurately:** room planes and corner, desk, shelf board, monitor
shell and stand, keyboard (layout is standard), poster frame and print, book blocks, pots, lamp
base, arm and dish, camera pose.

**Needs artistic approximation:** foliage (leaf count, shapes and orientation can only match the
silhouette), the figurine, book spine titles (only partly legible), the exact light falloff and
colour grading, wood grain, and the monitor stand's hidden geometry (only the base is visible, so the
neck is designed to be hidden behind the panel and keyboard rather than inferred).

**Not recoverable from the image:** the desk's front edge and legs, anything behind the monitor,
the room beyond the frame, and true physical scale (the scale above is a plausible choice that is
consistent with the visible proportions).
