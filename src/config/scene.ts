// Assets exported by blender/scripts/export_all.py. All are in world space, placed at the origin.
export const MODELS = {
  room: "/models/room.glb",
  desk: "/models/desk.glb",
} as const;

// Temporary real-time lighting until the bake in Phase 4. Intensities are three.js physical units.
export const TEMP_LIGHT_LEVELS = {
  lamp: { intensity: 6, angle: Math.PI * 0.32, penumbra: 0.9 },
  shelf_led: { intensity: 7, width: 1.0, height: 0.03 },
  monitor: { intensity: 1.2, width: 0.6, height: 0.32 },
  // Stands in for bounce light so the room's edges stay readable; the bake replaces it.
  fill: { intensity: 0.8, sky: "#2a3550", ground: "#3a2a1c" },
};
