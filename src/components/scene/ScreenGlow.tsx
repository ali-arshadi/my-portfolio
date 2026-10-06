"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { PointLight } from "three";
import { useScrollProgress } from "./useScrollProgress";

export function ScreenGlow() {
  const lightRef = useRef<PointLight>(null);
  const progress = useScrollProgress();

  useFrame(() => {
    if (!lightRef.current) {
      return;
    }

    lightRef.current.intensity = 2.5 + progress.current.e * 2.5;
  });

  return (
    <pointLight
      ref={lightRef}
      color="#6f94ff"
      intensity={2.5}
      distance={4.5}
      decay={1}
      position={[0, 1.5, 1.6]}
    />
  );
}
