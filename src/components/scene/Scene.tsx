"use client";

import { ContactShadows } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { Desk } from "./Desk";
import { Keyboard } from "./Keyboard";
import { Lamp } from "./Lamp";
import { Monitor } from "./Monitor";
import { ScreenGlow } from "./ScreenGlow";
import { WallDecor } from "./WallDecor";

function Room() {
  return (
    <group>
      <mesh
        position={[0, -2.25, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0d0e11" roughness={0.96} metalness={0} />
      </mesh>
      <mesh position={[0, 3.2, -3.15]} receiveShadow>
        <planeGeometry args={[20, 11]} />
        <meshStandardMaterial color="#101116" roughness={0.93} metalness={0} />
      </mesh>
    </group>
  );
}

export function Scene() {
  return (
    <>
      <color attach="background" args={["#08090c"]} />
      <fog attach="fog" args={["#08090c", 8.5, 20]} />

      <ambientLight color="#7180a6" intensity={0.12} />
      <hemisphereLight args={["#65739a", "#14110f", 0.34]} />

      <ScreenGlow />
      <pointLight
        color="#5575c8"
        intensity={5.2}
        distance={7}
        decay={2}
        position={[2.4, 2.8, -1.6]}
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
