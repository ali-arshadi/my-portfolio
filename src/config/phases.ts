// Phase boundaries along the camera move's scroll (0-1). Kept apart from config/camera.ts, which needs
// three.js, so the page's scroll code can use them without pulling three.js into the static fallback.
// The holds are short: a long opening hold plus the ease out of it
// made the first quarter of the scroll feel dead. The middle key sits at the move's time midpoint, so
// the camera passes through it at an even speed.
export const PHASES = {
  establishing: [0, 0.1],
  approach: [0.1, 0.51],
  alignment: [0.51, 0.92],
  focused: [0.92, 1],
} as const;
