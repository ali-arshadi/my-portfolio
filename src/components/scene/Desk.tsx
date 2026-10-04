"use client";

export function Desk() {
  return (
    <mesh position={[0, -0.1, 0.8]}>
      <boxGeometry args={[9, 0.2, 5]} />
      <meshStandardMaterial color="#15171e" roughness={0.35} metalness={0.3} />
    </mesh>
  );
}
