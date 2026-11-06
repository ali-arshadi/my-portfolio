"use client";

import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { AgXToneMapping, SRGBColorSpace } from "three";
import { LOADER_RING } from "@/components/hero/Loader";
import { EXPOSURE, HERO_CAMERA } from "@/config/scene.generated";
import { Experience } from "./Experience";

export default function DeskCanvas() {
  return (
    <>
      <div className="absolute inset-0">
        <Canvas
          className="h-full w-full"
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: AgXToneMapping,
            toneMappingExposure: 2 ** EXPOSURE, // Blender's exposure is in stops
            outputColorSpace: SRGBColorSpace,
          }}
          camera={{
            position: [...HERO_CAMERA.position],
            fov: HERO_CAMERA.fov,
            near: 0.01,
            far: 20,
          }}
          style={{ pointerEvents: "none" }}
        >
          <Experience />
        </Canvas>
      </div>
      <LoadStatus />
    </>
  );
}

// Drives the full-screen loader (hero/Loader.tsx) and marks <html data-scene-ready> once every model
// and lightmap has loaded, so the scene is revealed complete, never half-built (globals.css). The shown
// percentage eases toward the real one, so it never jumps or runs backwards; at 100 the ring lights up
// for a moment before the reveal. It lives in this lazily loaded module so the rest of the page never
// pulls in three.js.
const EASE = 0.08;
const LIGHT_UP_MS = 500;

// The loader's target: the real progress, held under 100 until every load has finished. Read from
// drei's progress store each frame rather than through a hook, so loading never re-renders anything.
function loadTarget() {
  const { active, loaded, total, progress } = useProgress.getState();
  return !active && total > 0 && loaded === total
    ? 100
    : Math.min(progress, 99);
}

function LoadStatus() {
  useEffect(() => {
    const loader = document.getElementById("loader");
    const value = loader?.querySelector("[data-loader-value]");
    const fill = loader?.querySelector<SVGCircleElement>(".loader-fill");
    let shown = 0;
    let frame = 0;
    let timer = 0;
    const tick = () => {
      const target = loadTarget();
      shown = Math.min(target, shown + Math.max((target - shown) * EASE, 0.4));
      const percent = Math.floor(shown);
      if (value) value.textContent = String(percent);
      loader?.setAttribute("aria-valuenow", String(percent));
      fill?.setAttribute(
        "stroke-dashoffset",
        String(LOADER_RING.length * (1 - shown / 100)),
      );
      if (shown >= 100) {
        loader?.setAttribute("data-complete", "");
        timer = window.setTimeout(() => {
          document.documentElement.dataset.sceneReady = "";
        }, LIGHT_UP_MS);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
