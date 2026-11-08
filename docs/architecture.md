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
    export_all.py            writes blender/build/models/*.glb and src/config/scene.generated.ts
    compare.py               renders the hero frame and overlays it on the reference
    render_still.py          renders the opening frame -> src/assets/opening-frame.webp
  regenerate.sh              one command: textures -> scene -> bake -> export -> validate -> compress
  build/                     raw models and lightmaps (git-ignored local output)
scripts/optimize-assets.mjs  compresses blender/build/ into what the site serves (pnpm assets)
public/models/               compressed GLBs: meshopt geometry, WebP textures
public/lightmaps/            compressed lightmaps: near-lossless WebP
                             (both committed, so the site runs without Blender)
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
reason (`shared/export.py`). The comparison runs against the raw output in `blender/build/`, and the
compressor only rewrites a served file whose source is newer, so a regeneration that changes nothing
leaves `public/` untouched. On a fresh clone, without `blender/build/`, the first regeneration
rewrites everything once.

**Compression** (`scripts/optimize-assets.mjs`, Phase 7): models get meshopt geometry (positions
quantized to 14 bits, about 0.3 mm across the room; the scale moves onto each node, so code that
measures a mesh multiplies by its world scale) and WebP textures (0.4–1.5 of 255 mean error). Lightmaps
are near-lossless WebP, every texel within 2 of 255 of the bake, dither intact: lossy WebP broke the dark
falloffs into blocks, and the dither noise is what limits the saving. 10.0 MiB of raw output becomes
4.5 MiB (models 4.6 -> 1.3, lightmaps 5.4 -> 3.2).

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

### Ambient motion (Phase 8)

- **Plants** sway in the vertex shader (`Workspace.tsx`, `addSway`): each vertex moves sideways by
  its `_sway` weight (0 at the pot, 1 at the tips), along incommensurate sines of time and position,
  so it never visibly loops and costs no CPU per frame. Up to 8 mm at the pothos's vine tips, 4 mm on
  the snake plant. The offset is in world metres, turned into the mesh's own space, because the
  compressed models carry a scale on each node. Shader patches chain (`patch`), once per material: the
  leaves also carry the lamp-layer patch.
- **The candle** flickers (`SceneMotion.tsx`): the flame's glow and height wobble on incommensurate
  sines; bloom carries it into the room.
- **Reduced motion** sets `motionScale` to 0: the plants hold still and the flame burns steadily.

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
      ScenePointer.tsx    the one window pointer handler; useSceneTarget registry (§8)
      LampSwitch.tsx      the lamp's switch
      ShelfObjects.tsx    the books and figurine: hover lift, open a panel
    shelf/                ShelfPanel (the dialog), panelState
    interfaces/           HeroOverlay, MonitorInterface, PortfolioContent, InteractionHint, Loader
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

Implemented (`components/screen/`).

- **One scroll.** `ScrollController` pins `#hero` for the camera move (2.2 viewport heights) plus the
  monitor content's scroll distance, and one timeline drives both: `scroll.t` for the camera, then
  `scroll.content` for the screen, one page pixel per content pixel. There is no nested scroll box:
  wheel, trackpad, keys and the scrollbar all scroll the page, and reversing is exact. The timeline is
  rebuilt when the content's height or the viewport height changes, and refreshed after it is built
  (a trigger made after the page's load event is not measured until something refreshes it).
- **The screen.** `MonitorScreen` puts drei `<Html transform>` at the `Screen` node's world pose, turned
  to face the viewer, with `distanceFactor` chosen so its 1280 × 720 CSS px cover the 0.64 m screen
  (1 px = distanceFactor / 400 world units). It sits at the scene root rather than in a portal under
  the node: a portal keeps its own copy of the scene state, and when it was made before `CameraRig`'s
  camera became the default, the HTML was projected through the old camera.
- **The swap.** The screen texture baked into the model is the portfolio design's hero and header
  (`blender/scripts/shared/textures.py`: `screen()`), and `ScreenContent`'s first view is the same hero
  as HTML (`ScreenHero`, fixed pixel positions on the 1280 × 720 screen, `HERO`). The texture paints
  that layout at 1.25× with the same fonts (vendored in `blender/fonts/`), placing text as the
  browser does (line box, ascent and descent, letter-spacing per character); glyph positions agree to
  about 1 px. The HTML fades in over the last 0.08 of the camera's alignment, so the swap can't be seen.
  Keep `HERO` and `SCREEN_HERO` in step, and re-bake after changing either (the screen's light is in
  the bake).
- **The header** (`ScreenNav`) sits over the screen, outside the scrolling content: clear on the first
  view, as painted; as the content scrolls it narrows to 860 px and turns to frosted glass
  (`MonitorScreen` sets `--p` and `--q`). Its links scroll the page, not the content, to a section
  (`screenNav` in `scrollState.ts`, registered by `ScrollController`): sections are found by
  `data-section`, not `id`, as the static page's copy of them is in the DOM too.
- **Scroll cues are drawn, not written** (`hero/ScrollCue.tsx`): a mouse outline whose wheel dot
  slides down and fades, on a loop (held still with reduced motion), with a screen-reader label. The
  page's hero shows it in the lamp's amber, the one UI accent not in lime (labelled "Scroll to step up to the screen", or "Scroll
  for my work" in static mode); the monitor's hero shows it bottom right, as a link to the profile.
  The texture paints that one with the dot at rest, where the animation starts (`SCROLL_CUE` and
  `SCREEN_HERO["scroll"]` in step).
- **The portfolio design** (`sections/*`, styles under `.folio` in `globals.css`), from the owner's
  design canvas: warm black `#0d0d0b`, bone `#eceae3`, lime `#c8f03c`; Bricolage Grotesque for
  display and text, JetBrains Mono for labels (`next/font`, in the root layout). Order: practices band
  (marquee; still with reduced motion), Profile, Impact tiles, Live in production, Achareh Bazaar
  (request-to-payment flow and the Vue 2 → Vue 3 migration), Where I've shipped, Daily drivers, the
  lime contact block. Sizes use container units (`cqw`) of `.folio`, never `vw`: on the monitor the
  content is 1280 px wide whatever the window is, and the same markup fits a phone. The design's
  experience accordion is shown fully open here: opening a row would change the content's height, and
  with it the length of the page's scroll, under the reader.
- **Input and accessibility.** The HTML is drawn into `ScreenLayer`, over the canvas but outside its
  `aria-hidden` wrapper. It is `inert` and ignores the pointer until the camera has arrived. `#hero`
  (and GSAP's pin spacer, in `globals.css`) let clicks through to it. "Skip to content" scrolls to
  the camera's arrival.
- **Narrow screens.** Below 900 px wide the screen would be unreadable, so the HTML is not mounted and
  the page shows the sections below the hero instead (`SCREEN_MEDIA`, `min-[900px]:hidden`).
- **Sharpness.** At the focused pose the screen is square on and the CSS transform close to identity;
  text was sharp at 1440 × 810. The full-viewport fallback this section planned has not been needed.

## 8. Interaction model

- **One pointer handler** (`scene/ScenePointer.tsx`). The canvas takes no pointer events (the page
  scrolls over it and the monitor's links sit above it), so `ScenePointer` listens on the window
  (`pointermove`, `click`) and raycasts into every registered target; the nearest hit wins and the
  cursor turns to a pointer over it. Objects register with `useSceneTarget({ root, part?, onHover?,
onActivate })`: `root` is a scene node name (all its descendants are tested, hidden `*_hit` boxes
  included), and `part` maps a hit to the piece it stands for (one book of the row). Having a single
  handler keeps the targets from fighting over the cursor. Targets are live only in the opening frame
  (`scroll.t <= ACTIVE_UNTIL`, 0.02), once `<html data-scene-ready>` is set, and while no panel is
  open; events over page controls (links, buttons, an open dialog) are left to them. Scrolling away or
  opening a panel ends a hover even if the pointer did not move.
- **The marks** (`scene/SceneHotspots.tsx`). Nothing else shows a reader that the scene's objects can be
  clicked, so each one (the lamp's click box, the top of the row of books, the figurine's head) gets a
  lime dot with a pulse ring: drei `<Html>` pinned to the object, in the canvas's `aria-hidden`
  wrapper, taking no pointer events. They fade in 1.6 s after the scene is ready (once the lamp is
  on), only while the objects can be used (opening frame, no panel open), and for good once the reader
  clicks any object (`ScenePointer` sets `<html data-scene-touched>`). No pulse with reduced motion.
- **Implemented: the lamp** (`LampSwitch.tsx`, Phase 8). Clicking the desk lamp in the opening frame
  switches it off and on. `lampLevel` fades the lamp's baked light, its live highlight and its bulb
  and diffuser together; switching on, the bulb catches with a brief flicker (instant with reduced
  motion). Active only before the camera moves and once the scene is ready. On every load the lamp
  starts off and catches on by itself 0.7 s into the loader's reveal, so the first thing the reader
  sees is the desk light coming on (skipped if they click it first, or with `?lamp=`).
- **Implemented: the shelf** (`scene/ShelfObjects.tsx`). Each book (`book_0` … `book_7`, hit on its
  own mesh, no proxy box needed) opens the **stack panel**: "Daily drivers" by group with that book's
  entry of `data/tools.ts` in lime, then "Live in production". `config/shelf.ts` maps each spine title (painted from
  `blender/scripts/config.py` `BOOKS`) to its tool; every spine names a tool from the stack (the
  second reads "Tailwind", short for Tailwind CSS, which would not fit the spine). The **figurine**, a GitHub-style cat, opens the owner's **GitHub profile** in a
  new tab (`GITHUB` in `data/contact.ts`), from the click's own handler so the browser allows it.
  Hovering an object lifts it (books 14 mm, figurine 8 mm; the shelf's front edge hides their bases),
  damped, or instantly when `motionScale` is 0; the object stays lifted while its panel is open.
- **Panels** (`shelf/ShelfPanel.tsx`, state in `shelf/panelState.ts`). HTML over the canvas, not
  WebGL: one modal `<dialog>` (`aria-labelledby` its heading) in the top layer, so the browser traps
  focus and makes the page inert. Escape, the close button or a click on the backdrop closes it, and
  focus returns to the element that had it. While one is open `html[data-panel-open]` stops the page
  scrolling (with `scrollbar-gutter: stable`, so the canvas does not resize), so the pinned hero and
  the camera stay put. The panel fades and rises in, with no animation under reduced motion. It is in the
  portfolio design (`.folio`: warm black, Bricolage, mono labels, square edges) and reads the same data
  and titles as the sections (`stack`, `work`), so its content stays in step with the page.
- **Keyboard and static mode.** The 3D objects take only the mouse, so in 3D mode a button ("Daily
  drivers") and a link ("GitHub"), hidden until focused, do what the books and the figurine do. In the static page
  (`data-scene="static"`) the buttons are hidden and the same content is already in `#content`.
- **Content source.** The data files (`about`, `impact`, `work`, `experience`, `tools`, `contact`)
  follow the owner's resume and their portfolio design canvas, which they confirmed as true. Work
  cards show the owner's screenshots (`src/assets/work/`, 1600 px WebP, through `next/image`, eager:
  lazy loading does not follow the monitor's transform), in 2:1 frames anchored to the top; a second
  screenshot fades in on hover (Achareh Sazeh's pricing page). The shelf panel shows the first one as
  a thumbnail.
- Still planned: the **candle** toggling the shelf accent light (optional; dropped if it doesn't earn
  its place).
- Content is never invented: anything missing is marked as a placeholder in the data file.

## 9. Loading and fallback

Implemented in Phase 7.

- **Loader** (`hero/Loader.tsx`, styles in `globals.css`). In 3D mode a full-screen loader covers the
  page from the first paint: a lime ring (the portfolio's accent) filling around the percentage, with
  "Setting up the desk" under it, the way 3D sites such as Lusion and Bruno Simon's portfolio open on a
  minimal centred loader. `DeskCanvas`'s `LoadStatus` reads drei's progress store each frame and eases
  the shown value toward it, so it never jumps or runs backwards; at 100% the ring glows for half a
  second, like the lamp switching on, then `<html data-scene-ready>` fades the loader out over the
  ready scene. The page does not scroll while it shows.
- **Mode before paint.** An inline `beforeInteractive` script in the root layout
  (`scene/sceneMedia.ts`) sets `<html data-scene>` while the page is parsed, so a phone never flashes
  the loader; without JavaScript no mode is set and the loader stays hidden.
- **Still for static mode only.** A render of the opening frame (`blender/scripts/render_still.py` ->
  `src/assets/opening-frame.webp`, 67 KB, `next/image`) is the whole hero in static mode. In 3D mode it
  is hidden, and as a lazy image it is not even downloaded: the loader reveals the live scene directly,
  with no still in between.
- **Scene mode** (`scene/sceneMode.ts`). 3D needs a viewport at least 900 px wide and WebGL 2. Otherwise
  the page is static: the still, then the sections below the hero, no pin and no camera move.
  `<html data-scene>` (`3d`, `static`, `pending`) drives the CSS that swaps the sections, the scroll
  hint and the loading line (`globals.css`).
- **Static mode downloads no 3D code.** The canvas module (three.js, R3F, drei, postprocessing) is
  loaded only in 3D mode, and nothing outside it imports three.js: the camera phases live in
  `config/phases.ts`, apart from `config/camera.ts`, for that reason.
- `prefers-reduced-motion` keeps the 3D scene with the fade cut of §6 rather than the still.

## 10. Budgets

| Item                        | Budget                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Triangles (whole scene)     | ≤ 120k (current scene: 36.5k)                                                                 |
| Draw calls at the hero pose | ≤ 120. Keycaps are merged into one mesh per material (they are not individually interactive). |
| GLB download (all assets)   | ≤ 8 MB. Current: 1.3 MiB of models + 3.2 MiB of lightmaps (Phase 7, see §3)                   |
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
