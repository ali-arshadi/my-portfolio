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

    lightRef.current.intensity = 4 + progress.current.e * 5.1;
  });

  return (
    <pointLight
      ref={lightRef}
      color="#6f94ff"
      intensity={4}
      distance={6}
      decay={1}
      position={[0, 1.5, 1.6]}
    />
  );
}
