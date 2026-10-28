"use client";

import { useLayoutEffect, useRef } from "react";
import { type RectAreaLight, type SpotLight } from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { TEMP_LIGHTS } from "@/config/scene.generated";
import { TEMP_LIGHT_LEVELS } from "@/config/scene";

RectAreaLightUniformsLib.init();

type Light = (typeof TEMP_LIGHTS)[keyof typeof TEMP_LIGHTS];

function AreaLight({
  light,
  intensity,
  width,
  height,
}: {
  light: Light;
  intensity: number;
  width: number;
  height: number;
}) {
  const ref = useRef<RectAreaLight>(null);

  useLayoutEffect(() => {
    const [x, y, z] = light.target;
    ref.current?.lookAt(x, y, z);
  }, [light]);

  return (
    <rectAreaLight
      ref={ref}
      color={light.color}
      intensity={intensity}
      width={width}
      height={height}
      position={[...light.position]}
    />
  );
}

// Temporary lights matching the Blender preview, replaced by baked light layers in Phase 4.
export function Lighting() {
  const lamp = useRef<SpotLight>(null);
  const { lamp: lampLevel, shelf_led, monitor, fill } = TEMP_LIGHT_LEVELS;

  useLayoutEffect(() => {
    const spot = lamp.current;
    if (!spot) {
      return;
    }
    spot.target.position.set(...TEMP_LIGHTS.lamp.target);
    spot.target.updateMatrixWorld();
  }, []);

  return (
    <>
      <hemisphereLight args={[fill.sky, fill.ground, fill.intensity]} />
      <spotLight
        ref={lamp}
        color={TEMP_LIGHTS.lamp.color}
        intensity={lampLevel.intensity}
        angle={lampLevel.angle}
        penumbra={lampLevel.penumbra}
        decay={2}
        position={[...TEMP_LIGHTS.lamp.position]}
      />
      <AreaLight light={TEMP_LIGHTS.shelf_led} {...shelf_led} />
      <AreaLight light={TEMP_LIGHTS.monitor} {...monitor} />
    </>
  );
}
