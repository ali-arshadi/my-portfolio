"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Box3, Vector3 } from "three";
import { shelfPanel } from "@/components/shelf/panelState";
import { ACTIVE_UNTIL } from "./ScenePointer";
import { scroll } from "./scrollState";

// The marks show this long after the loader has revealed the scene, once the lamp has come on.
const SHOW_AFTER_MS = 1600;

// Where each clickable object's mark sits: its node, and where on its bounding box (world space).
const SPOTS = [
  // the lamp's click box around its head: its middle
  { node: "lamp_hit", at: (box: Box3) => box.getCenter(new Vector3()) },
  // the row of books: just above the middle of its top
  {
    node: "books",
    at: (box: Box3) => box.getCenter(new Vector3()).setY(box.max.y + 0.02),
  },
  // the figurine: just above its head
  {
    node: "figurine",
    at: (box: Box3) => box.getCenter(new Vector3()).setY(box.max.y + 0.015),
  },
] as const;

// Lime marks with a pulse on the scene's clickable objects (the lamp, the books, the figurine), so a
// reader sees there is something to click without being told: nothing else shows it until they hover
// one. They are HTML pinned to the objects (drei <Html>, in the canvas's aria-hidden wrapper, taking
// no pointer events: ScenePointer still does the clicking). They show when the objects can be used:
// in the opening frame, once the scene is ready and the lamp is on, while no panel is open, and
// until the reader clicks an object for the first time (<html data-scene-touched>). Styles in
// globals.css (.hotspot); with reduced motion the marks do not pulse.
export function SceneHotspots() {
  const scene = useThree((state) => state.scene);
  const [spots, setSpots] = useState<Vector3[] | null>(null);
  const marks = useRef<(HTMLSpanElement | null)[]>([]);
  const readyAt = useRef(-1);
  const shown = useRef<boolean | null>(null);

  useFrame(() => {
    // the models attach to the scene after their first render: find the objects once they are there
    if (!spots) {
      const found = SPOTS.map(({ node, at }) => {
        const object = scene.getObjectByName(node);
        return object && at(new Box3().setFromObject(object));
      });
      if (found.every(Boolean)) {
        setSpots(found as Vector3[]);
      }
      return;
    }
    const root = document.documentElement.dataset;
    if ("sceneReady" in root && readyAt.current < 0) {
      readyAt.current = performance.now();
    }
    const show =
      readyAt.current >= 0 &&
      performance.now() - readyAt.current > SHOW_AFTER_MS &&
      scroll.t <= ACTIVE_UNTIL &&
      !("sceneTouched" in root) &&
      shelfPanel.get() === null;
    if (show !== shown.current) {
      shown.current = show;
      marks.current.forEach((mark) => mark?.classList.toggle("is-shown", show));
    }
  });

  if (!spots) {
    return null;
  }
  return (
    <>
      {spots.map((position, i) => (
        <Html
          key={SPOTS[i].node}
          position={position}
          center
          zIndexRange={[4, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span
            ref={(el) => {
              marks.current[i] = el;
            }}
            aria-hidden="true"
            className="hotspot"
          />
        </Html>
      ))}
    </>
  );
}
