// The scroll-driven camera path (see docs/architecture.md §6). The camera is a pure function of the
// scroll progress t (0-1), so reversing direction at any point is exact.

import { Vector3 } from "three";
import { HERO_CAMERA, SCREEN_CAMERA } from "./scene.generated";

type Vec3 = readonly [number, number, number];

export type CameraKey = {
  t: number;
  position: Vec3;
  target: Vec3;
  fov: number;
};

// Phase boundaries along the scroll. The holds are short: a long opening hold plus the ease out of it
// made the first quarter of the scroll feel dead. The middle key sits at the move's time midpoint, so
// the camera passes through it at an even speed.
export const PHASES = {
  establishing: [0, 0.1],
  approach: [0.1, 0.51],
  alignment: [0.51, 0.92],
  focused: [0.92, 1],
} as const;

const hero = new Vector3(...HERO_CAMERA.position);
const screenPosition = new Vector3(...SCREEN_CAMERA.position);
const screenCenter = new Vector3(...SCREEN_CAMERA.target);

// The generated hero target is a point 3 m along the view. Pulled in to the screen's distance it gives
// the same view, and the target then travels a short, even path to the screen instead of swinging in
// from far behind the wall.
const heroTarget = hero
  .clone()
  .add(
    new Vector3(...HERO_CAMERA.target)
      .sub(hero)
      .setLength(hero.distanceTo(screenCenter)),
  );

const toVec3 = (v: Vector3): Vec3 => [v.x, v.y, v.z];
const mix = (a: Vector3, b: Vector3, k: number) => a.clone().lerp(b, k);

export const CAMERA_KEYS: CameraKey[] = [
  {
    t: 0,
    position: toVec3(hero),
    target: toVec3(heroTarget),
    fov: HERO_CAMERA.fov,
  },
  {
    t: PHASES.establishing[1],
    position: toVec3(hero),
    target: toVec3(heroTarget),
    fov: HERO_CAMERA.fov,
  },
  // halfway in, lifted a little so the move reads as stepping up to the desk; the view leads the step
  // and has turned most of the way to the screen
  {
    t: PHASES.approach[1],
    position: toVec3(
      mix(hero, screenPosition, 0.55).add(new Vector3(0, 0.03, 0)),
    ),
    target: toVec3(mix(heroTarget, screenCenter, 0.7)),
    fov: HERO_CAMERA.fov,
  },
  {
    t: PHASES.alignment[1],
    position: toVec3(screenPosition),
    target: toVec3(screenCenter),
    fov: SCREEN_CAMERA.fov,
  },
  {
    t: 1,
    position: toVec3(screenPosition),
    target: toVec3(screenCenter),
    fov: SCREEN_CAMERA.fov,
  },
];

// Catmull-Rom tangents scaled by key spacing, flat where the camera holds still (two equal keys), so
// the path eases out of and into each hold without overshooting.
function tangent(
  keys: readonly CameraKey[],
  i: number,
  pick: (k: CameraKey) => number,
) {
  const prev = keys[Math.max(0, i - 1)];
  const next = keys[Math.min(keys.length - 1, i + 1)];
  const v = pick(keys[i]);
  if (pick(prev) === v || pick(next) === v || next.t === prev.t) {
    return 0;
  }
  return (pick(next) - pick(prev)) / (next.t - prev.t);
}

function hermite(
  keys: readonly CameraKey[],
  t: number,
  pick: (k: CameraKey) => number,
) {
  const i = Math.max(
    0,
    Math.min(keys.findIndex((k, j) => j > 0 && t <= k.t) - 1, keys.length - 2),
  );
  const a = keys[i];
  const b = keys[i + 1];
  const dt = b.t - a.t;
  const u = Math.min(1, Math.max(0, (t - a.t) / dt));
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * pick(a) +
    (u3 - 2 * u2 + u) * dt * tangent(keys, i, pick) +
    (-2 * u3 + 3 * u2) * pick(b) +
    (u3 - u2) * dt * tangent(keys, i + 1, pick)
  );
}

// Writes the camera pose at progress t into `position` and `target`; returns the vertical fov.
export function evaluateCamera(t: number, position: Vector3, target: Vector3) {
  const x = Math.min(1, Math.max(0, t));
  for (let c = 0; c < 3; c++) {
    position.setComponent(
      c,
      hermite(CAMERA_KEYS, x, (k) => k.position[c]),
    );
    target.setComponent(
      c,
      hermite(CAMERA_KEYS, x, (k) => k.target[c]),
    );
  }
  return hermite(CAMERA_KEYS, x, (k) => k.fov);
}
