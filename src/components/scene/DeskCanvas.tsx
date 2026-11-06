"use client";

import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { AgXToneMapping, SRGBColorSpace } from "three";
import { EXPOSURE, HERO_CAMERA } from "@/config/scene.generated";
import { Experience } from "./Experience";

export default function DeskCanvas() {
  return (
    <>
      <div className="scene-canvas absolute inset-0">
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

// Fills in the hero's loading line (#load-progress, rendered by StaticHero) and marks
// <html data-scene-ready> once every model and lightmap has loaded, so the canvas fades in over the
// still frame complete, never half-built (globals.css). It lives in this lazily loaded module so the
// rest of the page never pulls in three.js.
function LoadStatus() {
  const { active, loaded, total, progress } = useProgress();
  const ready = !active && total > 0 && loaded === total;

  useEffect(() => {
    const percent = document.querySelector("#load-progress [data-percent]");
    if (percent) {
      percent.textContent = `${Math.round(ready ? 100 : progress)}%`;
    }
  }, [progress, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    // a frame later, so the first rendered image is on screen before the fade starts
    const frame = requestAnimationFrame(() => {
      document.documentElement.dataset.sceneReady = "";
    });
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  return null;
}
