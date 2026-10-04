"use client";

import { useLayoutEffect, useRef } from "react";
import {
  DoubleSide,
  Vector3,
  type Group,
  type Object3D,
  type SpotLight,
} from "three";

export function Lamp() {
  const headRef = useRef<Group>(null);
  const lightRef = useRef<SpotLight>(null);
  const targetRef = useRef<Object3D>(null);

  useLayoutEffect(() => {
    if (!targetRef.current) {
      return;
    }

    targetRef.current.updateWorldMatrix(true, false);
    const aim = targetRef.current.getWorldPosition(new Vector3());

    if (headRef.current) {
      headRef.current.lookAt(aim);
    }

    if (lightRef.current) {
      lightRef.current.target = targetRef.current;
      lightRef.current.target.updateMatrixWorld();
    }
  }, []);

  return (
    <group position={[-3.05, 0, 1]}>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.07, 28]} />
        <meshStandardMaterial color="#1a1d26" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.32, 0.68, 0.06]} rotation={[0.22, 0, -0.48]}>
        <cylinderGeometry args={[0.03, 0.036, 1.28, 12]} />
        <meshStandardMaterial
          color="#2a2e3a"
          metalness={0.62}
          roughness={0.3}
        />
      </mesh>
      <group ref={headRef} position={[0.78, 1.22, 0.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.26, 0.34, 24, 1, true]} />
          <meshStandardMaterial
            color="#c48a3c"
            emissive="#ffb454"
            emissiveIntensity={1.1}
            metalness={0.25}
            roughness={0.4}
            side={DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color="#ffb454"
            emissive="#ffb454"
            emissiveIntensity={1.6}
          />
        </mesh>
        <spotLight
          ref={lightRef}
          color="#ffb454"
          intensity={36}
          angle={0.48}
          penumbra={0.7}
          distance={10}
          decay={1.6}
        />
      </group>
      <object3D ref={targetRef} position={[3.05, 0.08, 0.35]} />
    </group>
  );
}
