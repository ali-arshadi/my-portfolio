"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { MathUtils, type SpotLight } from "three";
import { LAMP_CONE, LIGHTS } from "@/config/scene.generated";
import { lampLevel } from "./lampState";

// Blender gives a spot light's power in watts spread over a sphere; three.js wants intensity per
// steradian, so the same lamp is watts / 4pi.
const LAMP_INTENSITY = LIGHTS.lamp.watts / (4 * Math.PI);

// All diffuse light is baked (see Workspace). What remains live:
// - the lamp spot, which lightmapped materials only take the specular part of (the bake can't hold
//   reflections, since they depend on the camera), and which fades with the lamp level;
// - a small environment for reflections, with glowing panels where the light sources are, so metal and
//   glossy surfaces catch them.
export function Lighting() {
  const spot = useRef<SpotLight>(null);
  const { lamp, shelf_led: led, monitor, rim } = LIGHTS;

  useLayoutEffect(() => {
    const light = spot.current;
    if (!light) {
      return;
    }
    light.target.position.set(...lamp.target);
    light.target.updateMatrixWorld();
  }, [lamp]);

  useFrame(() => {
    if (spot.current) {
      spot.current.intensity = LAMP_INTENSITY * lampLevel.value;
    }
  });

  return (
    <>
      <spotLight
        ref={spot}
        color={lamp.color}
        intensity={LAMP_INTENSITY}
        angle={MathUtils.degToRad(LAMP_CONE.angle / 2)}
        penumbra={LAMP_CONE.blend}
        decay={2}
        position={[...lamp.position]}
      />
      <Environment resolution={128} frames={1}>
        <color attach="background" args={["#020204"]} />
        <Lightformer
          form="circle"
          color={lamp.color}
          intensity={6}
          scale={0.4}
          position={[...lamp.position]}
          target={[...lamp.target]}
        />
        <Lightformer
          form="rect"
          color={led.color}
          intensity={3}
          scale={[0.9, 0.04, 1]}
          position={[...led.position]}
          target={[...led.target]}
        />
        <Lightformer
          form="rect"
          color={monitor.color}
          intensity={0.6}
          scale={[0.6, 0.34, 1]}
          position={[...monitor.position]}
          target={[...monitor.target]}
        />
        <Lightformer
          form="rect"
          color={rim.color}
          intensity={0.5}
          scale={[1, 1, 1]}
          position={[...rim.position]}
          target={[...rim.target]}
        />
      </Environment>
    </>
  );
}
