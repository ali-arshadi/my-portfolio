"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { MeshNormalMaterial } from "three";

// Calibration aid: `?view=normals` shades every surface by its facing direction,
// so walls, desk and floor read as flat colours with crisp edges regardless of lighting.
export function DebugView() {
  const get = useThree((state) => state.get);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view !== "normals") {
      return;
    }

    const { scene } = get();
    const material = new MeshNormalMaterial();
    scene.overrideMaterial = material;
    return () => {
      scene.overrideMaterial = null;
      material.dispose();
    };
  }, [get]);

  return null;
}
