"use client";

import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { MathUtils, Mesh, Quaternion, Vector3 } from "three";
import { PHASES } from "@/config/camera";
import { ASSETS } from "@/config/scene.generated";
import { scroll, screenScroll } from "@/components/scene/scrollState";
import {
  SCREEN_BACKGROUND,
  SCREEN_PX,
  ScreenContent,
  WindowDots,
} from "./ScreenContent";
import { screenLayer } from "./ScreenLayer";

const MONITOR = ASSETS.find((a) => a.name === "monitor")!.model;

// The HTML fades in over the last stretch of the camera's alignment with the screen, when nothing in
// the scene overlaps it any more, and takes input once the camera has arrived.
const FADE = [PHASES.alignment[1] - 0.08, PHASES.alignment[1]] as const;

// The portfolio, as live HTML on the 3D monitor's screen (drei <Html transform> on the Screen node).
// It exists only in 3D mode, which is only used on screens wide enough to read it (sceneMode.ts).
export function MonitorScreen() {
  const { scene } = useGLTF(MONITOR);
  const screen = useMemo(() => scene.getObjectByName("Screen"), [scene]);
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const distance = useSyncExternalStore(
    screenScroll.subscribe,
    screenScroll.get,
    () => 0,
  );

  // Where the HTML goes: the Screen node's world pose, turned round (the screen faces the viewer along
  // its local -z; the HTML plane faces +z) and a hair in front of the glass. It sits at the scene root
  // rather than in a portal under the node: a portal keeps its own copy of the scene state, and if it
  // was made before CameraRig's camera became the default, the HTML was projected through the old one.
  //
  // Its size: 1 CSS px is distanceFactor / 400 world units in drei's transform mode, chosen so the
  // screen's width in pixels covers the 3D screen exactly. The width is the geometry's times the node's
  // world scale: the compressed models store positions quantized, with the scale moved onto the node.
  const placement = useMemo(() => {
    if (!(screen instanceof Mesh)) {
      return null;
    }
    screen.updateWorldMatrix(true, false);
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    screen.matrixWorld.decompose(position, quaternion, scale);
    position.add(new Vector3(0, 0, -0.0005).applyQuaternion(quaternion));
    quaternion.multiply(
      new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI),
    );
    screen.geometry.computeBoundingBox();
    const box = screen.geometry.boundingBox!;
    const width = (box.max.x - box.min.x) * scale.x;
    return {
      position,
      quaternion,
      distanceFactor: (400 * width) / SCREEN_PX.width,
    };
  }, [screen]);

  // <Html> renders its children in a separate React root, after this component's effects, so the
  // content is measured from its ref callback, as soon as it exists.
  const measureContent = useCallback((el: HTMLDivElement | null) => {
    content.current = el;
    if (!el) {
      return;
    }
    const measure = () => screenScroll.set(el.scrollHeight - SCREEN_PX.height);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => {
      observer.disconnect();
      content.current = null;
      screenScroll.set(0);
    };
  }, []);

  const last = useRef({ opacity: -1, live: false, y: NaN });
  useFrame(() => {
    const el = frame.current;
    if (!el || !content.current) {
      return;
    }
    const opacity = MathUtils.smoothstep(scroll.t, FADE[0], FADE[1]);
    const live = scroll.t >= FADE[1] - 1e-3;
    const y = Math.round(scroll.content * distance);
    const prev = last.current;
    if (opacity !== prev.opacity) {
      el.style.opacity = String(opacity);
      el.style.visibility = opacity > 0 ? "visible" : "hidden";
    }
    if (live !== prev.live) {
      el.style.pointerEvents = live ? "auto" : "none";
      el.inert = !live;
    }
    if (y !== prev.y) {
      content.current.style.transform = `translate3d(0, ${-y}px, 0)`;
    }
    last.current = { opacity, live, y };
  });

  if (!placement) {
    return null;
  }

  return (
    <Html
      transform
      portal={screenLayer as React.MutableRefObject<HTMLElement>}
      distanceFactor={placement.distanceFactor}
      position={placement.position}
      quaternion={placement.quaternion}
      zIndexRange={[10, 0]}
    >
      <div
        ref={frame}
        inert
        className="relative overflow-hidden"
        style={{
          width: SCREEN_PX.width,
          height: SCREEN_PX.height,
          background: SCREEN_BACKGROUND,
          opacity: 0,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <ScreenContent ref={measureContent} />
        <WindowDots />
      </div>
    </Html>
  );
}
