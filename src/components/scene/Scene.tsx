"use client";

import { CameraRig } from "./CameraRig";
import { Desk } from "./Desk";
import { Keyboard } from "./Keyboard";
import { Lamp } from "./Lamp";
import { Monitor } from "./Monitor";

export function Scene() {
  return (
    <>
      <color attach="background" args={["#090a0e"]} />
      <fog attach="fog" args={["#090a0e", 7, 18]} />
      <ambientLight color="#8b9bb4" intensity={0.16} />
      <pointLight
        color="#6f94ff"
        intensity={6}
        distance={6}
        decay={2}
        position={[0, 1.55, 0.95]}
      />
      <pointLight
        color="#6f94ff"
        intensity={1.4}
        distance={8}
        decay={2}
        position={[2.4, 1.8, -1.1]}
      />
      <CameraRig />
      <Desk />
      <Monitor />
      <Keyboard />
      <Lamp />
    </>
  );
}
