"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  MeshStandardMaterial,
  Object3D,
  type InstancedMesh,
} from "three";

const ROWS = 4;
const COLS = 13;
const KEY_COUNT = ROWS * COLS;

export function Keyboard() {
  const keysRef = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new BoxGeometry(0.12, 0.04, 0.12), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#3f4654",
        metalness: 0.16,
        roughness: 0.55,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = keysRef.current;
    if (!mesh) {
      return;
    }

    const dummy = new Object3D();
    const startX = -0.84;
    const startZ = -0.21;
    const gapX = 0.14;
    const gapZ = 0.14;
    let index = 0;

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        dummy.position.set(startX + col * gapX, 0.09, startZ + row * gapZ);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  useLayoutEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <group position={[0, 0, 1.35]}>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[1.9, 0.06, 0.62]} />
        <meshStandardMaterial
          color="#14171f"
          metalness={0.28}
          roughness={0.55}
        />
      </mesh>
      <instancedMesh
        ref={keysRef}
        args={[geometry, material, KEY_COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}
