"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils } from "three";
import { lampLevel } from "./lampState";
import { motionScale } from "./motionState";
import { type SceneTarget, useSceneTarget } from "./ScenePointer";

// The lamp starts off and catches on by itself this long after the loader starts revealing the scene
// (its fade takes 900 ms), so the first thing the reader sees is the desk light coming on.
const AUTO_ON_MS = 700;

// Switching on, the bulb catches with a brief flicker: lamp level by milliseconds since the click.
const CATCH = [
  [60, 0.55],
  [120, 0.15],
  [170, 0.8],
  [220, 0.4],
] as const;

function catchLevel(ms: number) {
  return CATCH.find(([until]) => ms < until)?.[1] ?? 1;
}

// Clicking the desk lamp switches it off and on. ScenePointer does the hit test, in the opening frame
// only: the lamp itself (any of its parts, or its lamp_hit box around the head). lampLevel then fades the lamp's
// baked light, its live highlight and its glowing bulb and diffuser together (Workspace, Lighting).
//
// On every load the lamp is off; once the scene is ready it switches on by itself, unless the reader
// clicked it first or the URL sets ?lamp= (DebugView).
export function LampSwitch() {
  const target = useRef(0);
  const switchedOnAt = useRef(-1);
  const autoOn = useRef<{ pending: boolean; readyAt: number }>({
    pending: true,
    readyAt: -1,
  });

  useEffect(() => {
    // start from the current level, so ?lamp=… (DebugView) holds, and skip the automatic switch-on
    target.current = lampLevel.value;
    if (new URLSearchParams(window.location.search).has("lamp")) {
      autoOn.current.pending = false;
    }
  }, []);

  const lamp = useMemo<SceneTarget>(
    () => ({
      root: "desk_lamp",
      onActivate: () => {
        autoOn.current.pending = false;
        target.current = target.current ? 0 : 1;
        switchedOnAt.current = target.current ? performance.now() : -1;
      },
    }),
    [],
  );
  useSceneTarget(lamp);

  useFrame((_, delta) => {
    const auto = autoOn.current;
    if (auto.pending && "sceneReady" in document.documentElement.dataset) {
      const now = performance.now();
      if (auto.readyAt < 0) {
        auto.readyAt = now;
      } else if (now - auto.readyAt >= AUTO_ON_MS) {
        auto.pending = false;
        target.current = 1;
        switchedOnAt.current = now;
      }
    }
    if (switchedOnAt.current >= 0 && motionScale.value > 0) {
      const ms = performance.now() - switchedOnAt.current;
      lampLevel.value = catchLevel(ms);
      if (ms >= CATCH[CATCH.length - 1][0]) {
        switchedOnAt.current = -1;
      }
      return;
    }
    lampLevel.value =
      motionScale.value > 0
        ? MathUtils.damp(lampLevel.value, target.current, 14, delta)
        : target.current;
  });

  return null;
}
