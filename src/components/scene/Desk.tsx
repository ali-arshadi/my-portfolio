"use client";

export function Desk() {
  return (
    <mesh position={[0, -0.1, 0.8]}>
      <boxGeometry args={[9, 0.2, 5]} />
      <meshStandardMaterial color="#15171e" metalness={0.42} roughness={0.46} />
    </mesh>
  );
}
