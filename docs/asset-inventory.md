# Asset inventory

One generator script and one GLB per asset. All GLBs are in world space (see
[architecture.md §2](architecture.md#2-coordinate-system)). "Pivot" is the object origin inside the
GLB. "Interactive nodes" are names the app looks up, so they must not change without updating
`src/config/scene.ts`.

| Asset                          | Script                  | GLB               | Main nodes / interactive nodes                                                                                                                                                              | Pivot                                               | Tri budget | Lightmap                              |
| ------------------------------ | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------- | ------------------------------------- |
| Room (back + left wall, floor) | `create_room.py`        | `room.glb`        | `room_back_wall`, `room_left_wall`, `room_floor`                                                                                                                                            | world origin                                        | 1k         | 1536²                                 |
| Desk                           | `create_desk.py`        | `desk.glb`        | `desk_top`, `desk_leg_*`                                                                                                                                                                    | world origin                                        | 1k         | 2048 × 512                            |
| Monitor                        | `create_monitor.py`     | `monitor.glb`     | `monitor_panel`, `monitor_back`, `monitor_neck`, `monitor_hinge`, `monitor_base`, **`Screen`** (HTML anchor)                                                                                | `Screen`: centre of the glass, +Z facing the viewer | 3k         | 1024²                                 |
| Keyboard                       | `create_keyboard.py`    | `keyboard.glb`    | `keyboard_case`, `keyboard_keys` (all caps merged into one mesh)                                                                                                                            | centre of the case base                             | 12k        | 1024²                                 |
| Desk lamp                      | `create_desk_lamp.py`   | `desk-lamp.glb`   | `lamp_base`, `lamp_arm_*`, `lamp_spring`, `lamp_head`, **`lamp_diffuser`** (emissive), **`lamp_light_anchor`** (empty: position + direction of the live spot light), **`lamp_hit`** (proxy) | `lamp_base` centre on the desk                      | 10k        | 1024²                                 |
| Wall poster                    | `create_wall_poster.py` | `wall-poster.glb` | `poster_frame`, `poster_mat`, `poster_print`, `poster_glass`                                                                                                                                | centre of the print                                 | 0.5k       | print: own UV 1536 × 2048; frame 512² |
| Shelf                          | `create_shelf.py`       | `shelf.glb`       | `shelf_board`, **`shelf_led`** (emissive)                                                                                                                                                   | board centre, top face                              | 0.5k       | 1024 × 512                            |
| Books                          | `create_books.py`       | `books.glb`       | **`book_0` … `book_6`** (separate objects, each with its own spine texture)                                                                                                                 | bottom centre of each book                          | 0.5k       | 1024² shared                          |
| Figurine                       | `create_figurine.py`    | `figurine.glb`    | **`figurine`**, `figurine_eyes` (emissive)                                                                                                                                                  | bottom centre                                       | 3k         | 512²                                  |
| Candle                         | (in `create_shelf.py`)  | `shelf.glb`       | **`candle`**, `candle_flame` (emissive)                                                                                                                                                     | bottom centre                                       | 0.5k       | 256²                                  |
| Shelf plant                    | `create_shelf_plant.py` | `shelf-plant.glb` | `shelf_plant_pot`, `shelf_plant_leaves` (vertex colour R = sway weight)                                                                                                                     | pot bottom centre                                   | 15k        | 1024²                                 |
| Floor plant                    | `create_floor_plant.py` | `floor-plant.glb` | `floor_plant_pot`, `floor_plant_leaves` (vertex colour R = sway weight)                                                                                                                     | pot bottom centre                                   | 8k         | 1024²                                 |

**Bold** names are interactive or driven by the app.

## Generated textures

| Texture            | Source               | Notes                                                                                  |
| ------------------ | -------------------- | -------------------------------------------------------------------------------------- |
| Poster print       | `shared/textures.py` | 4 lines, `#c29e8a` / `#db945e`, vendored monospace bold                                |
| Book spines (7)    | `shared/textures.py` | Framework/language titles; final titles live in `config.py`                            |
| Screen placeholder | `shared/textures.py` | Only for the Blender preview and the bake's monitor light. The site renders real HTML. |
| Lightmaps          | `bake.py`            | Two layers per asset (`base`, `lamp`), see architecture §4                             |

## Current state (Phase 1)

| Asset           | State                                                                                                                                                                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Room, desk      | Built by `create_room.py` / `create_desk.py`, validated (names, bounds, triangle budget, materials, lightmap UVs), exported to `public/models/room.glb` (36 tris) and `desk.glb` (236 tris), loaded by the site. Plain PBR colours; textures and the bake come in Phase 4. |
| Everything else | Still only in the legacy single-file pipeline (`blender/scene.py`, `bake_export.py`) and `public/models/desk-scene.glb`, placed for the old camera. Not loaded by the site. Rebuilt as separate assets in Phases 2–3.                                                      |
