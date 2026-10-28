"use client";

import { Canvas } from "@react-three/fiber";
import { AgXToneMapping, SRGBColorSpace } from "three";
import { HERO_CAMERA } from "@/config/scene.generated";
import { Experience } from "./Experience";

export default function DeskCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: AgXToneMapping,
        toneMappingExposure: 1,
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
  );
}
