"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Object3D, Raycaster, Vector2 } from "three";
import { shelfPanel } from "@/components/shelf/panelState";
import { scroll } from "./scrollState";

// Up to this far into the scroll the scene's objects can be clicked: the opening frame, before the
// camera moves.
export const ACTIVE_UNTIL = 0.02;

export type SceneTarget = {
  // The scene node to raycast into: all of its descendants, hidden *_hit boxes included.
  root: string;
  // Which part of the root a hit stands for (one book of the row, say); the root itself by default.
  // Returning null ignores the hit.
  part?: (hit: Object3D, root: Object3D) => Object3D | null;
  // Called with the part under the pointer, then with null when the pointer leaves it.
  onHover?: (part: Object3D | null) => void;
  onActivate: (part: Object3D) => void;
};

const targets = new Set<SceneTarget>();

// Makes a scene node clickable while the component is mounted. Pass a stable object (useMemo).
export function useSceneTarget(target: SceneTarget) {
  useEffect(() => {
    targets.add(target);
    return () => {
      targets.delete(target);
    };
  }, [target]);
}

// Objects can be used in the opening frame only, once the loader has revealed the scene, and not
// while one of their panels is open.
function interactive() {
  return (
    "sceneReady" in document.documentElement.dataset &&
    scroll.t <= ACTIVE_UNTIL &&
    shelfPanel.get() === null
  );
}

// Pointer events over page controls (the monitor's links, the skip link, an open panel) belong to them.
const PAGE_CONTROLS = "a, button, input, textarea, select, dialog";

type Hover = { target: SceneTarget; part: Object3D };

// The one pointer handler for every clickable object in the scene (the lamp, the books, the figurine).
// The canvas takes no pointer events (the page scrolls over it and the monitor's links sit above it),
// so this listens on the window and raycasts into the registered targets; the nearest hit wins. Doing
// it in one place keeps the targets from fighting over the cursor.
export function ScenePointer() {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const canvas = useThree((state) => state.gl.domElement);
  const hovered = useRef<Hover | null>(null);
  const clear = useRef(() => {});

  useEffect(() => {
    const ray = new Raycaster();
    const ndc = new Vector2();

    const pick = (event: MouseEvent): Hover | null => {
      if (
        !interactive() ||
        (event.target instanceof Element && event.target.closest(PAGE_CONTROLS))
      ) {
        return null;
      }
      const rect = canvas.getBoundingClientRect();
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(ndc, camera);
      let best: (Hover & { distance: number }) | null = null;
      for (const target of targets) {
        const root = scene.getObjectByName(target.root);
        const hit = root && ray.intersectObject(root, true)[0];
        if (!hit || (best && best.distance <= hit.distance)) {
          continue;
        }
        const part = target.part ? target.part(hit.object, root) : root;
        if (part) {
          best = { target, part, distance: hit.distance };
        }
      }
      return best;
    };

    const setHover = (next: Hover | null) => {
      const prev = hovered.current;
      if (prev?.target === next?.target && prev?.part === next?.part) {
        return;
      }
      prev?.target.onHover?.(null);
      next?.target.onHover?.(next.part);
      hovered.current = next && { target: next.target, part: next.part };
      document.body.style.cursor = next ? "pointer" : "";
    };
    clear.current = () => setHover(null);

    const onMove = (event: PointerEvent) => setHover(pick(event));
    const onLeave = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        setHover(null);
      }
    };
    const onClick = (event: MouseEvent) => {
      const hit = pick(event);
      if (hit) {
        hit.target.onActivate(hit.part);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerout", onLeave);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      window.removeEventListener("click", onClick);
      setHover(null);
      clear.current = () => {};
    };
  }, [camera, scene, canvas]);

  // scrolling away or opening a panel ends the hover, though the pointer did not move
  useFrame(() => {
    if (hovered.current && !interactive()) {
      clear.current();
    }
  });

  return null;
}
