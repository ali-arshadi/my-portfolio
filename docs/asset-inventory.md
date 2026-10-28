# Asset inventory

One generator script and one GLB per asset, all in `blender/scripts/` and `public/models/`. Every GLB is
in world space (see [architecture.md §2](architecture.md#2-coordinate-system)), so the site places them
all at the origin. "Pivot" is the asset root inside the GLB. **Bold** names are looked up by the site,
so they must not change without updating `src/config/scene.ts`.

| Asset       | Script                  | GLB               | Nodes                                                                                                                                                                                                                                                                         | Pivot                                                                                                               | Tris (budget) |
| ----------- | ----------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------- |
| Room        | `create_room.py`        | `room.glb`        | `room_back_wall`, `room_left_wall`, `room_floor`                                                                                                                                                                                                                              | world origin                                                                                                        | 36 (1k)       |
| Desk        | `create_desk.py`        | `desk.glb`        | `desk_top`, `desk_leg_0…3`                                                                                                                                                                                                                                                    | world origin                                                                                                        | 236 (1k)      |
| Monitor     | `create_monitor.py`     | `monitor.glb`     | `monitor_panel`, `monitor_back`, `monitor_hinge`, `monitor_neck`, `monitor_base`, **`Screen`** (HTML anchor; placeholder image until Phase 7)                                                                                                                                 | on the desk under the panel, turned by the monitor yaw. `Screen`'s geometry faces the viewer with no extra rotation | 942 (3k)      |
| Keyboard    | `create_keyboard.py`    | `keyboard.glb`    | `keyboard_case`, `keyboard_keys` (87 tapered caps, tenkeyless, merged)                                                                                                                                                                                                        | centre of the case base                                                                                             | 4,016 (12k)   |
| Desk lamp   | `create_desk_lamp.py`   | `desk-lamp.glb`   | `lamp_base`, `lamp_arm_lower`, `lamp_arm_upper`, `lamp_spring`, `lamp_head`, **`lamp_diffuser`**, **`lamp_bulb`** (emissive), **`lamp_light_anchor`** / **`lamp_light_target`** (empties: where the live light sits and aims), **`lamp_hit`** (proxy box, hidden by the site) | centre of the base on the desk                                                                                      | 8,092 (10k)   |
| Wall poster | `create_wall_poster.py` | `wall-poster.glb` | `poster_frame`, `poster_mat`, `poster_print`, `poster_glass`                                                                                                                                                                                                                  | on the wall, centre of the frame opening                                                                            | 768 (1k)      |
| Shelf       | `create_shelf.py`       | `shelf.glb`       | `shelf_board`, **`shelf_led`** (emissive)                                                                                                                                                                                                                                     | centre of the board's top face                                                                                      | 200 (500)     |
| Books       | `create_books.py`       | `books.glb`       | **`book_0` … `book_7`** (separate objects, left to right as seen from the camera; spines share one atlas)                                                                                                                                                                     | each book's bottom centre                                                                                           | 96 (500)      |
| Figurine    | `create_figurine.py`    | `figurine.glb`    | **`figurine`** (root), `figurine_body`, `figurine_eyes` (emissive)                                                                                                                                                                                                            | bottom centre, turned to face the camera                                                                            | 1,280 (3k)    |
| Candle      | `create_candle.py`      | `candle.glb`      | **`candle`** (root), `candle_cup`, `candle_wax`, **`candle_flame`** (emissive), **`candle_light_anchor`**                                                                                                                                                                     | bottom centre                                                                                                       | 572 (1.5k)    |
| Shelf plant | `create_shelf_plant.py` | `shelf-plant.glb` | `shelf_plant_pot`, **`shelf_plant_leaves`** (leaves + vines, `_SWAY` attribute)                                                                                                                                                                                               | pot bottom centre                                                                                                   | 8,680 (15k)   |
| Floor plant | `create_floor_plant.py` | `floor-plant.glb` | `floor_plant_pot`, **`floor_plant_leaves`** (`_SWAY` attribute)                                                                                                                                                                                                               | pot bottom centre                                                                                                   | 3,172 (8k)    |

Every mesh has two UV sets: `UVMap` for textures and `lightmap` (exported as `TEXCOORD_1`) for the
Phase 4 bake.

## Plant sway weight

`shelf_plant_leaves` and `floor_plant_leaves` carry a custom vertex attribute, `_SWAY` (three.js reads it
as `_sway`): 0 where the plant is anchored, rising to 1 at the tips. The Phase 8 vertex shader scales
its motion by it, so pots and stems never move. It is a separate attribute, not a vertex colour,
because three.js would otherwise multiply the leaves' colour by it.

## Generated textures

| Texture            | Source               | Notes                                                                                                  |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------ |
| Poster print       | `shared/textures.py` | 720 × 1120, four lines in DejaVu Sans Mono Bold, "Repeat." in orange                                   |
| Book spines        | `shared/textures.py` | One 1024² atlas, a 128 px column per book at the spine's real aspect ratio; titles from `config.BOOKS` |
| Screen placeholder | `shared/textures.py` | 1600 × 900. The site replaces it with real HTML in Phase 7                                             |
| Lightmaps          | `bake.py`            | Phase 4: two layers per asset (`base`, `lamp`), see architecture §4                                    |

## Lightmaps

Two per asset in `public/lightmaps/` (`<asset>.base.png`, `<asset>.lamp.png`), baked by
`blender/scripts/bake.py` into the asset's shared `lightmap` UV atlas. Sizes: room and desk 1024²;
monitor, keyboard, desk lamp, poster and both plants 512²; shelf, books and figurine 256²; candle 128².
Emissive and transparent meshes (screen, LED, bulb, diffuser, flame, glass, figurine eyes) are not
baked. 24 files, about 3.6 MB.

## Current state (Phase 4)

All twelve assets are built, validated, exported and baked. The site renders them with baked light
(two layers), a specular-only live lamp spot, environment reflections on metal, bloom on the light
sources and AgX tone mapping. The legacy single-file pipeline was removed in Phase 3 (it is in git
history).

Totals: about 28k triangles, 3.2 MB of GLB and 3.6 MB of lightmaps. The lamp and shelf plant are most
of the GLB size (smooth meshes whose vertices the lightmap unwrap splits); Phase 9 evaluates compression.
