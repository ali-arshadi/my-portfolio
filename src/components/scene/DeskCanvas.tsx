"use client";

import { Canvas } from "@react-three/fiber";
import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
} from "three";
import { Scene } from "./Scene";

export default function DeskCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      shadows={{ type: PCFSoftShadowMap }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: SRGBColorSpace,
      }}
      camera={{ position: [3.6, 2.5, 5.4], fov: 42, near: 0.1, far: 50 }}
      style={{ pointerEvents: "none" }}
    >
      <Scene />
    </Canvas>
  );
}
