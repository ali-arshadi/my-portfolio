"use client";

import { useLayoutEffect, useRef } from "react";
import { DoubleSide, type Object3D, type SpotLight } from "three";

export function Lamp() {
  const lightRef = useRef<SpotLight>(null);
  const targetRef = useRef<Object3D>(null);

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) {
      return;
    }

    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  return (
    <>
      <group position={[-3, 0, 0.2]}>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.08, 24]} />
          <meshStandardMaterial
            color="#20232d"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[0, 0.85, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
          <meshStandardMaterial
            color="#20232d"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[0.38, 1.65, 0]} rotation={[0, 0, 1]}>
          <coneGeometry args={[0.3, 0.4, 24, 1, true]} />
          <meshStandardMaterial
            color="#ffb454"
            emissive="#ffa030"
            emissiveIntensity={0.6}
            side={DoubleSide}
          />
        </mesh>
      </group>
      <spotLight
        ref={lightRef}
        color="#ffb454"
        intensity={16}
        distance={12}
        angle={0.7}
        penumbra={0.6}
        decay={1}
        position={[-2.6, 1.7, 0.3]}
      />
      <object3D ref={targetRef} position={[-0.8, 0, 1]} />
    </>
  );
}
