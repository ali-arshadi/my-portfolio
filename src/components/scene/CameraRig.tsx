"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  MathUtils,
  Vector3,
  type PerspectiveCamera as PerspectiveCameraType,
} from "three";
import { evaluateCamera, PHASES } from "@/config/camera";
import { CAMERA_ASPECT, HERO_CAMERA } from "@/config/scene.generated";
import { scroll } from "./scrollState";

const PARALLAX = { x: 0.06, y: 0.04 };

const { smoothstep } = MathUtils;

// The poses were framed for 16:9; narrower viewports widen the vertical fov
// so the horizontal framing stays the same.
function fitFov(fov: number, aspect: number) {
  if (aspect >= CAMERA_ASPECT) {
    return fov;
  }
  const half = MathUtils.degToRad(fov / 2);
  return MathUtils.radToDeg(
    2 * Math.atan((Math.tan(half) * CAMERA_ASPECT) / aspect),
  );
}

// The only code that moves the camera: its pose is a function of the scroll progress (config/camera.ts).
export function CameraRig() {
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const position = useRef(new Vector3());
  const look = useRef(new Vector3());
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onPointerMove = (event: MouseEvent) => {
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

  useFrame((state) => {
    const camera = cameraRef.current;
    if (!camera) {
      return;
    }

    const baseFov = evaluateCamera(scroll.t, position.current, look.current);
    // the pointer parallax belongs to the opening frame and fades out as the camera starts to move
    const fade = 1 - smoothstep(scroll.t, 0, PHASES.establishing[1]);
    camera.position.set(
      position.current.x + pointer.current.x * PARALLAX.x * fade,
      position.current.y - pointer.current.y * PARALLAX.y * fade,
      position.current.z,
    );
    camera.lookAt(look.current);

    const { width, height } = state.size;
    const fov = fitFov(baseFov, width / Math.max(height, 1));
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={HERO_CAMERA.fov}
      near={0.01}
      far={20}
      position={[...HERO_CAMERA.position]}
    />
  );
}
