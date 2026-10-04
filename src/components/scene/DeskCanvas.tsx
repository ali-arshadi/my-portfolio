"use client";

import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";

export default function DeskCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [3.6, 2.5, 5.4], fov: 42, near: 0.1, far: 40 }}
      style={{ pointerEvents: "none" }}
    >
      <Scene />
    </Canvas>
  );
}
