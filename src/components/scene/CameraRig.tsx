"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { PerspectiveCamera as PerspectiveCameraType } from "three";

const START_POSITION = [3.6, 2.5, 5.4] as const;
const LOOK_AT = [-0.3, 1.1, 0] as const;

export function CameraRig() {
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const width = useThree((state) => state.size.width);
  const fov = width < 768 ? 58 : 42;

  useLayoutEffect(() => {
    cameraRef.current?.lookAt(LOOK_AT[0], LOOK_AT[1], LOOK_AT[2]);
  }, [fov]);

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={fov}
      near={0.1}
      far={40}
      position={START_POSITION}
    />
  );
}
