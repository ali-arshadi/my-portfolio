"use client";

import { ContactShadows } from "@react-three/drei";
import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { CameraRig } from "./CameraRig";
import { Desk } from "./Desk";
import { Keyboard } from "./Keyboard";
import { Lamp } from "./Lamp";
import { Monitor } from "./Monitor";
import { ScreenGlow } from "./ScreenGlow";
import { BACK_WALL, LEFT_WALL, roomShift, WallDecor } from "./WallDecor";

function createWallNoise() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d canvas context unavailable for wall texture");
  }

  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    const vertical = Math.sin((y / size) * Math.PI) * 10;
    for (let x = 0; x < size; x += 1) {
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const noise = (n - Math.floor(n) - 0.5) * 18;
      const value = Math.max(
        0,
        Math.min(255, 242 + noise * 0.45 + vertical * 0.35),
      );
      const index = (y * size + x) * 4;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.6, 1.8);
  texture.needsUpdate = true;
  return texture;
}

function Room() {
  const narrow = useThree((state) => state.size.width < 700);
  const shift = roomShift(narrow);
  const noise = useMemo(() => createWallNoise(), []);

  useLayoutEffect(() => {
    return () => {
      noise.dispose();
    };
  }, [noise]);

  const half = LEFT_WALL.length / 2;
  const leftX = LEFT_WALL.cornerX - Math.cos(LEFT_WALL.yaw) * half;
  const leftZ = LEFT_WALL.cornerZ + Math.sin(LEFT_WALL.yaw) * half;
  const seamX = LEFT_WALL.cornerX + Math.sin(LEFT_WALL.yaw) * 0.045;
  const seamZ = LEFT_WALL.cornerZ + Math.cos(LEFT_WALL.yaw) * 0.045;

  return (
    <group>
      <mesh
        position={[0, -2.25, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0c0d11" roughness={0.96} metalness={0} />
      </mesh>

      <mesh position={[BACK_WALL.x, BACK_WALL.y, BACK_WALL.z]} receiveShadow>
        <boxGeometry
          args={[BACK_WALL.width, BACK_WALL.height, BACK_WALL.depth]}
        />
        <meshStandardMaterial
          color="#1c1e26"
          map={noise}
          roughness={0.92}
          metalness={0}
        />
      </mesh>

      <mesh
        position={[leftX + shift.x, BACK_WALL.y, leftZ + shift.z]}
        rotation={[0, LEFT_WALL.yaw, 0]}
        receiveShadow
      >
        <boxGeometry
          args={[LEFT_WALL.length, BACK_WALL.height, LEFT_WALL.thickness]}
        />
        <meshStandardMaterial
          color="#191b22"
          map={noise}
          roughness={0.94}
          metalness={0}
        />
      </mesh>

      <mesh
        position={[seamX + shift.x, BACK_WALL.y, seamZ + shift.z]}
        receiveShadow
      >
        <boxGeometry args={[0.045, BACK_WALL.height, 0.045]} />
        <meshStandardMaterial
          color="#3a3e4a"
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>
    </group>
  );
}

export function Scene() {
  return (
    <>
      <color attach="background" args={["#08090c"]} />
      <fog attach="fog" args={["#08090c", 8.5, 20]} />

      <ambientLight color="#6c7694" intensity={0.08} />
      <hemisphereLight args={["#62739a", "#161310", 0.18]} />

      <ScreenGlow />
      <pointLight
        color="#8ea6d6"
        intensity={18}
        distance={9}
        decay={2}
        position={[0.55, 1.7, -0.35]}
      />
      <pointLight
        color="#e2b48a"
        intensity={10}
        distance={11}
        decay={2}
        position={[-2.4, 2.05, 1.15]}
      />

      <CameraRig />
      <Room />
      <WallDecor />
      <Desk />
      <Monitor />
      <Keyboard />
      <Lamp />

      <ContactShadows
        position={[0, -0.185, 1.0]}
        opacity={0.5}
        scale={8}
        blur={2.6}
        far={4.5}
        resolution={512}
      />
    </>
  );
}
