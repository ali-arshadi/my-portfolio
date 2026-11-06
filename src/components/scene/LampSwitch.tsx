"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Raycaster, Vector2 } from "three";
import { lampLevel } from "./lampState";
import { motionScale } from "./motionState";
import { scroll } from "./scrollState";

// Up to this far into the scroll the lamp can be switched: the opening frame, before the camera moves.
const ACTIVE_UNTIL = 0.02;

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

// Clicking the desk lamp switches it off and on. The canvas takes no pointer events (the page scrolls
// over it and the monitor's links sit above it), so this listens on the window and raycasts into the
// lamp itself (any of its parts, or its lamp_hit box around the head). lampLevel then fades the lamp's
// baked light, its live highlight and its glowing bulb and diffuser together (Workspace, Lighting).
export function LampSwitch() {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const target = useRef(1);
  const switchedOnAt = useRef(-1);

  useEffect(() => {
    // start from the current level, so ?lamp=off (DebugView) holds
    target.current = lampLevel.value;
    const ray = new Raycaster();
    const ndc = new Vector2();
    let hovering = false;

    const overLamp = (event: MouseEvent) => {
      const lamp = scene.getObjectByName("desk_lamp");
      const ready = "sceneReady" in document.documentElement.dataset;
      if (!lamp || !ready || scroll.t > ACTIVE_UNTIL) {
        return false;
      }
      ndc.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      );
      ray.setFromCamera(ndc, camera);
      return ray.intersectObject(lamp, true).length > 0;
    };
    const onMove = (event: PointerEvent) => {
      const over = overLamp(event);
      if (over !== hovering) {
        hovering = over;
        document.body.style.cursor = over ? "pointer" : "";
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!overLamp(event)) {
        return;
      }
      target.current = target.current ? 0 : 1;
      switchedOnAt.current = target.current ? performance.now() : -1;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
      document.body.style.cursor = "";
    };
  }, [camera, scene]);

  useFrame((_, delta) => {
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
