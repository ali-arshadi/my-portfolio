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
  const geometry = useMemo(() => new BoxGeometry(0.11, 0.04, 0.1), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#232733",
        roughness: 0.5,
        metalness: 0.3,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = keysRef.current;
    if (!mesh) {
      return;
    }

    const dummy = new Object3D();
    let index = 0;

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        dummy.position.set(-0.85 + col * 0.142, 0.08, 0.95 + row * 0.14);
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
    <>
      <mesh position={[0, 0.03, 1.15]}>
        <boxGeometry args={[1.9, 0.06, 0.62]} />
        <meshStandardMaterial color="#14161c" roughness={0.5} metalness={0.4} />
      </mesh>
      <instancedMesh
        ref={keysRef}
        args={[geometry, material, KEY_COUNT]}
        frustumCulled={false}
      />
    </>
  );
}
