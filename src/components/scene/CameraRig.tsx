"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  Vector3,
  type PerspectiveCamera as PerspectiveCameraType,
} from "three";
import { useScrollProgress } from "./useScrollProgress";

const START = { x: 3.6, y: 2.5, z: 5.4 };
const END = { x: 0, y: 1.55, z: 2.35 };
const LOOK_START = { x: -0.3, y: 1.1, z: 0 };
const LOOK_END = { x: 0, y: 1.55, z: 0 };

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export function CameraRig() {
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const look = useRef(new Vector3());
  const pointer = useRef({ x: 0, y: 0 });
  const progress = useScrollProgress();
  const width = useThree((state) => state.size.width);
  const fov = width < 700 ? 58 : 42;

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = event.clientX / window.innerWidth - 0.5;
      pointer.current.y = event.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("mousemove", onPointerMove);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
    };
  }, []);

  useFrame(() => {
    const camera = cameraRef.current;
    if (!camera) {
      return;
    }

    const { e } = progress.current;
    const fade = 1 - e;

    camera.position.set(
      lerp(START.x, END.x, e) + pointer.current.x * 0.5 * fade,
      lerp(START.y, END.y, e) - pointer.current.y * 0.3 * fade,
      lerp(START.z, END.z, e),
    );
    look.current.set(
      lerp(LOOK_START.x, LOOK_END.x, e),
      lerp(LOOK_START.y, LOOK_END.y, e),
      0,
    );
    camera.lookAt(look.current);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={fov}
      near={0.1}
      far={50}
      position={[START.x, START.y, START.z]}
    />
  );
}
