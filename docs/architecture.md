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
      export.py              per-asset glTF export
      validation.py          name, bounds, pivot and triangle checks
    config.py                layout knobs: positions, sizes, camera, lights
    create_room.py           create_desk.py   create_monitor.py   create_keyboard.py
    create_desk_lamp.py      create_wall_poster.py   create_shelf.py   create_books.py
    create_figurine.py       create_shelf_plant.py   create_floor_plant.py
    build_scene.py           runs every create_*, adds lights + camera, optional preview render
    bake.py                  bakes light layers into per-asset lightmaps
    export_all.py            writes public/models/*.glb and src/config/scene.generated.ts
    compare.py               renders the hero frame and overlays it on the reference
  regenerate.sh              one command: textures -> scene -> bake -> export -> validate
public/models/               generated GLBs (committed, so the site runs without Blender)
```

Each `create_*.py` exposes `build(cfg) -> root object` and can also run alone for a quick look. The
current single-file scripts (`blender/scene.py`, `blender/bake_export.py`, `blender/make_textures.py`)
are the starting material: they are split into the modules above during Phases 1–2 and removed once the
modular build reaches parity.

`pnpm models` runs `blender/regenerate.sh`, which reads the Python interpreter from `BLENDER_PYTHON`
(any Python with `bpy` 5.x, Pillow and NumPy; default `.venv-blender/bin/python`). Setup:

```bash
uv venv --python 3.13 .venv-blender
uv pip install --python .venv-blender/bin/python bpy pillow numpy
```

The camera is exported from Blender into `src/config/scene.generated.ts`, so the browser camera can never
drift from the camera the bake and the comparisons were made with. Regeneration is byte-for-byte
reproducible (checked over repeated runs), so unchanged assets never show up in a diff.

**Status (Phase 1):** `config.py`, `shared/{materials,geometry,export,validation}.py`, `create_room.py`,
`create_desk.py`, `build_scene.py`, `export_all.py`, `compare.py` and `regenerate.sh` exist. The other
`create_*` scripts and `bake.py` arrive in Phases 2–4. `shared/textures.py` and `blender/fonts/` arrive in
Phase 2.

## 4. Rendering

### Light layers

The bake produces, per asset, a lightmap atlas on UV channel 2 for two layers:

- **base**: every light except the desk lamp (shelf LED, candle, monitor, environment fill), with
  bounce light and contact shadows.
- **lamp**: the desk lamp alone.

In three.js each asset keeps a `MeshStandardMaterial` (albedo, roughness, metalness from Blender). A small
`onBeforeCompile` patch replaces the indirect-diffuse term with
`base + lampLevel * lamp`, where `lampLevel` is a shared uniform. Toggling the lamp animates `lampLevel`,
the bulb's emissive intensity and one real-time spot light together, so the baked pool, the glowing
diffuser and the live specular highlights stay in sync.

Real-time lights are kept for **specular only** (lamp spot, a weak cool monitor light). They do not cast
shadows; shadows come from the bake. The exact split is tuned in Phase 4, where double-counting
diffuse light is the main thing to check.

### Effects (candidates, each must earn its place in Phase 4)

- Bloom restricted to emissive surfaces (lamp diffuser, LED strip, candle flame).
- A very light vignette, only if the comparison shows the reference has one.
- No real-time AO or soft shadows: both are already in the bake.

### Plants

Subtle sway in the vertex shader (`onBeforeCompile`): displacement grows with height above the pot,
uses two or three incommensurate sine frequencies so it never visibly loops, and costs no CPU per frame.

## 5. Application structure

```
src/
  app/                    Next.js routes (page.tsx keeps the hero + fallback content)
  config/
    scene.generated.ts    cameras and temporary lights from Blender (do not edit)
    camera.ts             scroll keyframes and phase ranges
    scene.ts              asset list, light levels, effect settings
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
    interactions/         ScrollController, useInteractive, interaction registry
  data/                   portfolio content (existing files reused, see §8)
  hooks/  shaders/  utils/
```

## 6. Scroll and camera

- `ScrollController` creates one GSAP timeline with `ScrollTrigger` (`scrub`, pinned to `#hero`). It
  tweens a plain object `{ t }` from 0 to 1 and updates the hero overlay's opacity and translation.
  There is no React state update per frame.
- `CameraRig` reads `t` in `useFrame` and evaluates position, target and FOV along keyframes from
  `config/camera.ts` (Catmull-Rom for position and target, eased FOV). Because the camera is a pure
  function of `t`, reversing direction at any point is exact.
- Phases (starting values, tuned in Phase 6): establishing 0–0.15, approach 0.15–0.55,
  screen alignment 0.55–0.85, focused 0.85–1.
- The keyframe path is checked against the scene's bounding boxes so it never passes through geometry.
- `prefers-reduced-motion`: the timeline is replaced by a cross-fade between the hero and focused states.

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
5. **Font portability.** `make_textures.py` points at system font paths (Inter, DejaVu Sans Mono Bold)
   that are missing on this machine. Phase 2 vendors OFL fonts into `blender/fonts/`.
6. **Figurine.** The reference figure resembles a well-known brand mascot; it will be modelled as a
   generic stylised cat.
7. **Tooling location.** The `bpy` venv currently lives in a session scratch folder. `regenerate.sh` and
   the README document recreating it anywhere.
