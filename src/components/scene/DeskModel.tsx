"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import {
  Color,
  Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  type Texture,
} from "three";

export const DESK_MODEL_URL = "/models/desk-scene.glb";

// The lighting is baked into the textures, so every mesh is shown unlit.
// Mesh names in the .glb:
//   "glow_*"  emissive parts (lamp interior + bulb, shelf LED, candle flame, cat eyes)
//   "Screen"  the monitor screen (swap in your own live texture, see below)
//   anything else: baked texture, shown as-is
const SCREEN_DIM = 0.6;

function toUnlit(mesh: Mesh, screenTexture?: Texture | null) {
  const source = mesh.material as MeshStandardMaterial;

  if (mesh.name.startsWith("glow_")) {
    return new MeshBasicMaterial({
      color: source.emissive.clone().multiplyScalar(source.emissiveIntensity),
      side: source.side,
      toneMapped: false,
    });
  }

  if (mesh.name === "Screen") {
    return new MeshBasicMaterial({
      // A CanvasTexture used on a glTF mesh needs texture.flipY = false.
      map: screenTexture ?? source.map,
      color: new Color(SCREEN_DIM, SCREEN_DIM, SCREEN_DIM),
      side: source.side,
      toneMapped: false,
    });
  }

  // side is copied because leaves, lamp shells and posters are single-sided surfaces
  return new MeshBasicMaterial({
    map: source.map,
    side: source.side,
    toneMapped: false,
  });
}

type DeskModelProps = {
  screenTexture?: Texture | null;
};

export function DeskModel({ screenTexture }: DeskModelProps) {
  const { scene } = useGLTF(DESK_MODEL_URL);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (object instanceof Mesh) {
        object.material = toUnlit(object, screenTexture);
      }
    });
    return clone;
  }, [scene, screenTexture]);

  return <primitive object={model} />;
}

useGLTF.preload(DESK_MODEL_URL);
