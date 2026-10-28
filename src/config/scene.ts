// Assets exported by blender/scripts/export_all.py. All are in world space, placed at the origin.
export const MODELS = {
  room: "/models/room.glb",
  desk: "/models/desk.glb",
  monitor: "/models/monitor.glb",
  keyboard: "/models/keyboard.glb",
  deskLamp: "/models/desk-lamp.glb",
  wallPoster: "/models/wall-poster.glb",
  shelf: "/models/shelf.glb",
  books: "/models/books.glb",
  figurine: "/models/figurine.glb",
  candle: "/models/candle.glb",
  shelfPlant: "/models/shelf-plant.glb",
  floorPlant: "/models/floor-plant.glb",
} as const;

// Invisible meshes that only exist as click targets (see docs/asset-inventory.md).
export const HIT_TARGET_SUFFIX = "_hit";

// Temporary real-time lighting until the bake in Phase 4. Intensities are three.js physical units.
export const TEMP_LIGHT_LEVELS = {
  lamp: { intensity: 4, angle: Math.PI * 0.32, penumbra: 0.9 },
  shelf_led: { intensity: 6, width: 0.89, height: 0.03 },
  monitor: { intensity: 1.2, width: 0.6, height: 0.32 },
  candle: { intensity: 0.08, distance: 0.6 },
  // Stands in for bounce light so the room's edges stay readable; the bake replaces it.
  fill: { intensity: 0.8, sky: "#2a3550", ground: "#3a2a1c" },
};
