"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  MathUtils,
  Vector3,
  type PerspectiveCamera as PerspectiveCameraType,
} from "three";
import {
  CAMERA_ASPECT,
  HERO_CAMERA,
  SCREEN_CAMERA,
} from "@/config/scene.generated";
import { useScrollProgress } from "./useScrollProgress";

const PARALLAX = { x: 0.06, y: 0.04 };

const { lerp } = MathUtils;

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

export function CameraRig() {
  const cameraRef = useRef<PerspectiveCameraType>(null);
  const look = useRef(new Vector3());
  const pointer = useRef({ x: 0, y: 0 });
  const progress = useScrollProgress();

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

    const { e } = progress.current;
    const fade = 1 - e;
    const from = HERO_CAMERA;
    const to = SCREEN_CAMERA;

    camera.position.set(
      lerp(from.position[0], to.position[0], e) +
        pointer.current.x * PARALLAX.x * fade,
      lerp(from.position[1], to.position[1], e) -
        pointer.current.y * PARALLAX.y * fade,
      lerp(from.position[2], to.position[2], e),
    );
    look.current.set(
      lerp(from.target[0], to.target[0], e),
      lerp(from.target[1], to.target[1], e),
      lerp(from.target[2], to.target[2], e),
    );
    camera.lookAt(look.current);

    const { width, height } = state.size;
    const fov = fitFov(lerp(from.fov, to.fov, e), width / Math.max(height, 1));
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
