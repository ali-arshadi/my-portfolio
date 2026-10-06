"use client";

import { RoundedBox } from "@react-three/drei";

export function Desk() {
  return (
    <group>
      <RoundedBox
        args={[8.8, 0.18, 4.7]}
        radius={0.06}
        smoothness={6}
        position={[0, -0.08, 0.8]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#24211f"
          roughness={0.72}
          metalness={0.03}
        />
      </RoundedBox>

      {/* subtle front edge gives the desk some real thickness */}
      <mesh position={[0, -0.19, 3.08]} receiveShadow>
        <boxGeometry args={[8.65, 0.12, 0.08]} />
        <meshStandardMaterial color="#171513" roughness={0.82} />
      </mesh>

      {/* legs only become visible from wider camera angles */}
      {[-3.65, 3.65].map((x) => (
        <mesh key={x} position={[x, -1.45, 1.05]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 2.65, 0.16]} />
          <meshStandardMaterial color="#111216" roughness={0.42} metalness={0.72} />
        </mesh>
      ))}
    </group>
  );
}
