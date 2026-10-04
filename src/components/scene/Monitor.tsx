"use client";

import { useLayoutEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

function createScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 600;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("TODO: 2d canvas context unavailable for monitor screen");
  }

  ctx.fillStyle = "#0b0d13";
  ctx.fillRect(0, 0, 1024, 600);

  const dots = ["#ff5f57", "#febc2e", "#28c840"];
  dots.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(40 + index * 28, 36, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  const barColors = ["#7aa2ff", "#ffb454", "#8fd3a8", "#c39bff", "#5b6275"];
  for (let index = 0; index < 16; index += 1) {
    ctx.fillStyle = barColors[(index * 3) % 5];
    ctx.globalAlpha = 0.85;
    const indent = (index % 4) * 34;
    ctx.fillRect(60 + indent, 90 + index * 28, 80 + ((index * 97) % 300), 12);
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e9e7e2";
  ctx.font =
    "700 64px 'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Ali Arshadi", 600, 300);
  ctx.fillStyle = "#8b8f9c";
  ctx.font =
    "400 28px 'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Front-end developer", 604, 350);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function Monitor() {
  const texture = useMemo(() => createScreenTexture(), []);

  useLayoutEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <group>
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[3.3, 1.95, 0.12]} />
        <meshStandardMaterial color="#0c0d12" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.55, -0.1]}>
        <boxGeometry args={[0.25, 0.7, 0.12]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.03, -0.05]}>
        <boxGeometry args={[1.2, 0.06, 0.7]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.55, 0.07]}>
        <planeGeometry args={[3.05, 1.78]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
}
