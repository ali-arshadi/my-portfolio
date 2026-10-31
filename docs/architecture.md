# Architecture

## 1. Decisions taken in Phase 0

| Topic             | Decision                                                                                        | Why                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App framework     | **Keep Next.js 16** (App Router), canvas loaded client-only with `dynamic(..., { ssr: false })` | Chosen by the owner. The repo already has the hero overlay, sections, Tailwind and data files. R3F, drei and GSAP run unchanged inside a client component.                  |
| Blender runtime   | **`bpy` 5.2.3 LTS as a Python module** (Python 3.13 venv, created with `uv`)                    | No desktop Blender is installed. The module runs the same `bpy` API headless.                                                                                               |
| Lighting strategy | **Hybrid: Cycles-baked light layers + PBR materials + a few real-time lights**                  | See §4. The development machine has an Intel Iris Xe integrated GPU; the reference's soft bounce light and contact shadows are cheap when baked and expensive in real time. |
| Tone mapping      | **AgX in both Blender and three.js**                                                            | three r186 ships `AgXToneMapping`, so baked and live parts are graded the same way.                                                                                         |
| UI state          | A small store built on `useSyncExternalStore` (no new dependency)                               | Only a few values: lamp on/off, focus state, open panel. Revisit if it grows.                                                                                               |
| Scroll            | **GSAP ScrollTrigger** drives one timeline; replaces `useScrollProgress`                        | Single authoritative scroll state (§6).                                                                                                                                     |

Next.js 16 differs from older versions. Before writing app code in each phase, read the relevant guide in
`node_modules/next/dist/docs/` (per `AGENTS.md`).

## 2. Coordinate system

One world, metres, used by every script and component.

|                                       | Blender (Z up)                     | three.js / glTF (Y up)                   |
| ------------------------------------- | ---------------------------------- | ---------------------------------------- |
| Conversion                            | `(x, y, z)`                        | `(x, z, -y)` (done by the glTF exporter) |
| Back wall                             | plane `y = 0`, room is `y > 0`     | plane `z = 0`, room is `z < 0`           |
| Left wall (left in the opening frame) | plane `x = 0.9`, room is `x < 0.9` | plane `x = 0.9`                          |
| Floor                                 | `z = 0`                            | `y = 0`                                  |
| Desk top                              | `z = 0.76`                         | `y = 0.76`                               |
| Shelf top                             | `z = 1.4655`                       | `y = 1.4655`                             |
| Hero camera                           | (-1.082, 1.726, 1.462)             | (-1.082, 1.462, -1.726)                  |

All of these are defined once in `blender/scripts/config.py`. `export_all.py` writes the cameras and
temporary lights into `src/config/scene.generated.ts`, already converted to three.js axes. Verified in
Phase 1: the room and desk render in the browser from the generated camera with the same edges as the
Blender render ([`reference/phase1-browser-overlay.png`](reference/phase1-browser-overlay.png)).

Every GLB is exported **in world space**, so the app places them all at the origin. Object origins
inside each GLB are set to meaningful pivots (§ asset inventory).

## 3. Asset pipeline

```
blender/
  fonts/                     vendored OFL fonts for printed textures (poster, spines, screen placeholder)
  scripts/
    shared/
      materials.py           named PBR material library (one place for every colour/roughness)
      geometry.py            box / cylinder / rod / leaf helpers, bevel, UV unwrap
      textures.py            poster, spine and placeholder-screen images (Pillow)
      foliage.py             leaf meshes and the plants' sway weight
      export.py              per-asset glTF export
      validation.py          name, bounds, pivot and triangle checks
    config.py                layout knobs: positions, sizes, camera, lights
    create_room.py           create_desk.py   create_monitor.py   create_keyboard.py
    create_desk_lamp.py      create_wall_poster.py   create_shelf.py   create_books.py
    create_figurine.py       create_candle.py   create_shelf_plant.py   create_floor_plant.py
    build_scene.py           runs every create_*, adds lights + camera, optional preview render
    bake.py                  bakes light layers into per-asset lightmaps
    export_all.py            writes public/models/*.glb and src/config/scene.generated.ts
    compare.py               renders the hero frame and overlays it on the reference
  regenerate.sh              one command: textures -> scene -> bake -> export -> validate
public/models/               generated GLBs (committed, so the site runs without Blender)
```

Each `create_*.py` exposes `build() -> root object` and can also run alone for a quick look.

`pnpm models` runs `blender/regenerate.sh`, which reads the Python interpreter from `BLENDER_PYTHON`
(any Python with `bpy` 5.x, Pillow and NumPy; default `.venv-blender/bin/python`). Setup:

```bash
uv venv --python 3.13 .venv-blender
uv pip install --python .venv-blender/bin/python bpy pillow numpy
```

The camera is exported from Blender into `src/config/scene.generated.ts`, so the browser camera can never
drift from the camera the bake and the comparisons were made with. Regeneration is stable: an export
that matches the existing GLB's geometry, materials and images keeps the existing file, so unchanged
assets never show up in a diff (checked over five consecutive runs). Blender computes some mesh data on
several threads, which reorders vertices between runs; the comparison is order-independent for that
reason (`shared/export.py`).

**Status (Phase 3):** everything above exists except `bake.py` (Phase 4). The candle has its own
`create_candle.py`, and `shared/foliage.py` holds the leaf mesh and plant sway weight. `calibration.py`
turns pixel anchors measured in the reference into the placements in `config.py`.

## 4. Rendering

### Light layers (implemented in Phase 4)

`blender/scripts/lights.py` defines the light rig and splits it into two layers:

- **base**: shelf LED (full soft spread, so its wash fades out rather than ending in hard edges),
  candle, monitor glow, a picture lamp just above the poster, a small warm fill on the shelf, a cool
  rim from the right, a broad cool night-light wash on the right half of the back wall, and a faint
  world fill.
- **lamp**: the desk lamp: a 60° fully soft spot aimed near the measured centre of the reference's light
  pool, plus two faint helpers the reference needs: a warm glow in the wall corner behind the lamp (it
  also lights the poster's lower half) and a narrow fringe of the beam that reaches the floor plant's pot.

Phase 5 tuned the powers against the reference patch by patch (wall, LED spill, poster, pool, keyboard,
plant, screen), from Blender renders through `compare.py`.

Emissive materials belong to a layer as well. When one layer bakes, the other layer's lights and emitters
are switched off.

`blender/scripts/bake.py` bakes each layer per asset with Cycles: diffuse direct plus indirect, without
the surface colour, so each lightmap holds light, not colour. Details:

- **One atlas per asset:** all of an asset's meshes share one `lightmap` UV set (`TEXCOORD_1`). Flat
  meshes are packed face by face by `lightmap_pack`. Smooth-shaded meshes (pots, leaves, the lamp's dish)
  get connected islands from Smart UV Project instead: one island per face showed as a seam at every
  face of a pot. When an asset has both, all islands are packed together at an even texel density.
- **Better packing:** faces no camera pose sees (desk underside, outsides of the walls) are deleted, and
  long faces are sliced into near-square pieces, so the visible surfaces get most of the atlas.
- **Storage:** 8-bit PNGs of `sRGB(light / LIGHTMAP_SCALE)`. The sRGB curve spends the 8 bits on the dark
  end, which is most of this scene, and sampling them as sRGB textures gives the linear value back. The
  values are blurred very lightly in float and dithered before rounding, so the near-black falloffs do
  not band (risk 3 in §11).
- **Same run as the export:** baking runs inside `export_all.py`, so a lightmap always matches the UV
  layout of the GLB written in that run.
- **Not baked:** emissive and transparent surfaces (screen, LED, bulb, diffuser, flame, glass) light the
  scene and are rendered as they are.

In three.js (`Workspace.tsx`), every lightmapped `MeshStandardMaterial` gets:

- the base layer as its `lightMap`, at intensity `π · LIGHTMAP_SCALE`. three.js divides irradiance by π
  when it applies the surface colour; Cycles' value multiplies it directly.
- a small `onBeforeCompile` patch that adds the lamp layer times the shared `lampLevel` uniform
  (`lampState.ts`).

Changing `lampLevel.value` fades the baked lamp light everywhere at once, and the lamp's emissive bulb
and diffuser follow it every frame, so the pool and the glowing shade stay in sync. `?lamp=off` (or
`?lamp=0.4`) sets it for checking.

There are **no real-time lights.** Reflections come from a small generated environment
(`Lighting.tsx`, drei `Environment` + `Lightformer`s placed at the lamp, LED, monitor and rim
positions). Metals use it at full strength, since they have no diffuse colour for the bake to show on.
Everything else uses a trace of it, so it does not double the baked diffuse light.

Tone mapping is AgX in both Blender and three.js, with the same exposure (`EXPOSURE`, in stops).

### Live lamp highlight

Cycles' diffuse bake cannot hold reflections, because they depend on where the camera is. Without them
the lamp pool lost most of its brightness compared with the Blender preview. A single live spot light
sits at the bulb with the same cone and power (Blender watts / 4π). On lightmapped materials the shader
patch discards its diffuse part (`reflectedLight.directDiffuse = 0`), so it adds only the sheen on the
desk, keyboard and metal, and never double-counts the baked light. It fades with `lampLevel`.

### Baked reflection on dark surfaces

Most surfaces here are near-black (the walls' albedo is under 1% linear), so in Blender what shows on
them is mostly their rough reflection, several times their diffuse light. A diffuse-only bake loses it,
and in Phase 5 the browser crushed the walls and poster to pure black where Blender showed a lifted
near-black. The shader patch adds it back: baked light / π times three's `EnvironmentBRDF` (the same
split-sum term its environment lighting uses), on dielectrics only. The lamp layer counts only on the
roughest surfaces (roughness ≥ 0.9, the walls), because on glossier ones the live lamp spot already
draws that reflection; counting both made the pool 1.6× Blender's.

After this, browser and Blender agree within about ±15% on the pool, keyboard, books, screen, lamp
and plant pot (measured patch by patch at 1672 × 941).

### Effects (`Effects.tsx`)

- **Bloom** on light sources only. The scene renders in linear HDR, and the threshold (1.5) sits above
  every baked surface, so only the emissive bulb, diffuser, LED and flame glow. A small radius keeps the
  glow close to them; the first, wider setting hazed the dark walls next to the LED by up to 9×.
- **AgX tone mapping** runs as the last pass, with the renderer's exposure, as in the Blender preview.
- No vignette: the reference's dark corners come from its lighting, which the bake already reproduces.
- No real-time AO or soft shadows: both are already in the bake.

### Plants

Subtle sway in the vertex shader (`onBeforeCompile`): displacement grows with height above the pot,
uses two or three incommensurate sine frequencies so it never visibly loops, and costs no CPU per frame.

## 5. Application structure

```
src/
  app/                    Next.js routes (page.tsx keeps the hero + fallback content)
  config/
    scene.generated.ts    cameras, lights, asset + lightmap manifest from Blender (do not edit)
    camera.ts             scroll keyframes and phase ranges
    scene.ts              environment strengths, hit-target naming
  components/
    scene/
      DeskCanvas.tsx      <Canvas>, renderer settings, Suspense + loader
      Experience.tsx      assembles Workspace, CameraRig, Lighting, Effects
      Workspace.tsx       loads the GLBs, applies light-layer materials
      CameraRig.tsx       the only code that moves the camera
      Lighting.tsx        real-time lights
      Effects.tsx         postprocessing
      DebugView.tsx       `?view=normals` calibration view
    objects/              DeskLamp, Books, Plants, Monitor (interactive wrappers around GLB nodes)
    interfaces/           HeroOverlay, MonitorInterface, PortfolioContent, InteractionHint, Loader
    interactions/         useInteractive, interaction registry (ScrollController lives in hero/)
  data/                   portfolio content (existing files reused, see §8)
  hooks/  shaders/  utils/
```

## 6. Scroll and camera

Implemented in Phase 6.

- `components/hero/ScrollController.tsx` creates one GSAP timeline with `ScrollTrigger`, scrubbed
  (0.6 s smoothing) through `#hero` (320vh with a sticky inner frame). It tweens the plain object in
  `scene/scrollState.ts` (`{ t }`) from 0 to 1 and fades and lifts the hero text (`#hero-overlay`) over
  the establishing phase. There is no React state update per frame.
- `CameraRig` reads `t` in `useFrame` and evaluates position, target and FOV from the keyframes in
  `config/camera.ts`: cubic Hermite segments with Catmull-Rom tangents scaled by key spacing, flat at
  holds, so the camera eases out of the opening frame and into the screen without overshoot. Because the
  camera is a pure function of `t`, reversing direction at any point is exact. The pointer parallax
  fades out over the establishing phase.
- The hero target is the generated one pulled in to the screen's distance (same view), so the target
  travels a short path to the screen centre instead of swinging in from 3 m behind the wall.
- Phases: establishing 0–0.1 (hold), approach 0.1–0.51 (55% of the way, lifted 3 cm, view 70%
  turned), screen alignment 0.51–0.92, focused 0.92–1 (hold on the square-on screen pose). The hero is
  320vh, so the move gets 220vh of scroll. Tuned from a contact sheet of the move and a frame-to-frame
  difference profile: the first layout (15% hold, middle key at 0.55, 240vh) left the first quarter of
  the scroll dead and crammed most of the motion into 0.4–0.7; the profile is now an even bell that
  peaks mid-move.
- `?view=path` samples the path against every mesh's bounding box. Current closest approach: 0.32 m,
  to the desk top, at the screen pose.
- `prefers-reduced-motion`: no camera move. Past the hero's midpoint the scene fades out, cuts to the
  screen pose and fades back in (and back on the way up); the text hides after the first 15%.

## 7. Monitor HTML

- drei `<Html transform>` attached to the `Screen` node. A fixed-size DOM surface (16:9) is scaled so its
  width equals the 3D screen's width.
- The shelf plant overlaps the monitor's top-right corner in the reference, and plain `<Html>` always
  draws on top of the canvas. Phase 7 evaluates `occlude="blending"` (DOM placed behind a transparent hole
  in the canvas) to keep that overlap correct.
- At the focused pose the camera looks at the screen head-on, so the CSS transform is close to identity
  and text stays sharp.
- Pointer events are off until the focused phase, then on. Inside the screen, the portfolio scrolls in
  its own container with `overscroll-behavior: contain`. A wheel-up at its top passes through to the
  page, which reverses the camera.
- **Fallback:** if the transformed DOM is blurry or unreliable at the focused pose, the focused state
  hands over to a full-viewport HTML layer styled as the screen, cross-faded at the moment the 3D
  screen fills the view.

## 8. Interaction model

- `useInteractive({ id, label, enabled, onActivate, onHoverChange })` handles pointer and keyboard
  focus, cursor, tooltip and cleanup for any object. Hit testing uses the object's own mesh or a simple
  invisible proxy box.
- Interactive objects: **lamp** (toggle), **books** (each opens a configured panel), and **figurine** and
  **candle** (the figurine opens the About panel, the candle toggles the shelf accent light). The
  candle is optional and is dropped if it doesn't earn its place.
- Object interactions are enabled in the establishing phase only. During the approach they are
  disabled, and in the focused phase the monitor UI owns input.
- Content: the existing `src/data/work.ts`, `tools.ts`, `experience.ts` and `contact.ts` are the owner's
  own data and are reused as-is. Book panels reference entries in those files by id. Anything missing is
  marked as a placeholder in the data file, never invented.

## 9. Loading and fallback

- Assets load under one `Suspense` boundary. A loader overlay shows `useProgress` progress and fades out
  only when every GLB and lightmap is ready, so the workspace never appears half-built.
- Viewports narrower than ~900 px, browsers without WebGL 2, and `prefers-reduced-motion` get the static
  hero image (a Blender render of the opening frame) and the existing HTML sections.

## 10. Budgets

| Item                        | Budget                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Triangles (whole scene)     | ≤ 120k (current scene: 36.5k)                                                                 |
| Draw calls at the hero pose | ≤ 120. Keycaps are merged into one mesh per material (they are not individually interactive). |
| GLB download (all assets)   | ≤ 8 MB before KTX2; texture compression evaluated in Phase 9                                  |
| Lightmap GPU memory         | ≤ 64 MB                                                                                       |
| DPR                         | clamped to [1, 1.75]                                                                          |

## 11. Risks

1. **HTML on the monitor.** Blur under CSS 3D transforms and correct occlusion by the plant. Covered by §7's
   head-on final pose and the full-viewport fallback.
2. **Light-layer blending.** Combining baked diffuse with live specular can double-count light. Tuned
   against the reference in Phase 4.
3. **8-bit lightmaps in a very dark scene.** Banding is likely in near-black areas. Options: bake with an
   exposure offset and decode in the shader, or use 16-bit/KTX2 maps. Decided in Phase 4 after a test bake.
4. **Performance on integrated graphics.** The only hardware available for measurement is an Intel Iris
   Xe. Figures in the performance report will be for that machine and labelled as such.
5. **Font portability.** Resolved in Phase 2: DejaVu Sans Mono Bold and Noto Sans are vendored in
   `blender/fonts/` with their licences.
6. **Figurine.** The reference figure resembles a well-known brand mascot; it will be modelled as a
   generic stylised cat.
7. **Tooling location.** The `bpy` venv currently lives in a session scratch folder. `regenerate.sh` and
   the README document recreating it anywhere.
