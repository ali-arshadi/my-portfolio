"use client";

import { CameraRig } from "./CameraRig";
import { Desk } from "./Desk";
import { Keyboard } from "./Keyboard";
import { Lamp } from "./Lamp";
import { Monitor } from "./Monitor";
import { ScreenGlow } from "./ScreenGlow";

export function Scene() {
  return (
    <>
      <color attach="background" args={["#090a0e"]} />
      <fog attach="fog" args={["#090a0e", 7, 18]} />
      <ambientLight color="#303a55" intensity={0.5} />
      <ScreenGlow />
      <pointLight
        color="#3a4fa0"
        intensity={2.4}
        distance={10}
        decay={1}
        position={[3, 2.5, -2]}
      />
      <CameraRig />
      <Desk />
      <Monitor />
      <Keyboard />
      <Lamp />
    </>
  );
}
