"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Mesh, type MeshStandardMaterial, Vector3 } from "three";
import { motionScale, sceneTime } from "./motionState";

// The scene's small ambient motions: keeps the shared clock for the plants' sway (Workspace.tsx) and
// flickers the candle. With reduced motion, motionScale is 0: the plants hold still and the flame
// burns steadily.
export function SceneMotion() {
  const scene = useThree((state) => state.scene);
  const flame = useRef<{ mesh: Mesh; glow: number; scale: Vector3 } | null>(
    null,
  );

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      motionScale.value = m.matches ? 0 : 1;
    };
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    sceneTime.value = t;

    // the flame is looked up once its model has loaded
    if (!flame.current) {
      const mesh = scene.getObjectByName("candle_flame") as Mesh | undefined;
      if (!mesh) {
        return;
      }
      const material = mesh.material as MeshStandardMaterial;
      flame.current = {
        mesh,
        glow: material.emissiveIntensity,
        scale: mesh.scale.clone(),
      };
    }
    // a flicker from incommensurate sines, so it never visibly repeats: brightness dips and the flame
    // stretches as it gutters. Scaled from the node's own scale, which the compressed model sets.
    const { mesh, glow, scale } = flame.current;
    const k = motionScale.value;
    const flicker =
      0.5 * Math.sin(t * 7.3) +
      0.3 * Math.sin(t * 13.1 + 1.3) +
      0.2 * Math.sin(t * 23.7 + 2.1);
    const stretch = Math.sin(t * 5.1 + 0.7) * 0.6 + Math.sin(t * 11.3) * 0.4;
    (mesh.material as MeshStandardMaterial).emissiveIntensity =
      glow * (1 + 0.14 * flicker * k);
    mesh.scale.set(
      scale.x * (1 - 0.04 * stretch * k),
      scale.y * (1 + 0.08 * stretch * k),
      scale.z * (1 - 0.04 * stretch * k),
    );
  });

  return null;
}
