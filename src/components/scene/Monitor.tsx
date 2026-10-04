"use client";

import { useLayoutEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

const BEZEL_Z = 0.35;
const SCREEN_Z = 0.43;

function createScreenTexture() {
  const width = 1024;
  const height = 600;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("TODO: 2d canvas context unavailable for monitor screen");
  }

  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#141821";
  ctx.fillRect(0, 0, width, 44);

  const dots = ["#ff5f57", "#febc2e", "#28c840"];
  dots.forEach((color, index) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(28 + index * 22, 22, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  const bars = [
    { width: 280, color: "#3d4f6f" },
    { width: 360, color: "#4a5d3a" },
    { width: 180, color: "#6b4a2a" },
    { width: 310, color: "#3d4f6f" },
    { width: 220, color: "#4a3d6f" },
    { width: 400, color: "#3d4f6f" },
    { width: 140, color: "#4a5d3a" },
    { width: 300, color: "#3d4f6f" },
    { width: 250, color: "#6b4a2a" },
    { width: 190, color: "#4a3d6f" },
    { width: 340, color: "#3d4f6f" },
    { width: 160, color: "#4a5d3a" },
  ];

  bars.forEach((bar, index) => {
    ctx.fillStyle = bar.color;
    ctx.beginPath();
    ctx.roundRect(36, 78 + index * 36, bar.width, 14, 4);
    ctx.fill();
  });

  ctx.fillStyle = "#e9e7e2";
  ctx.font =
    "600 44px 'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Ali Arshadi", 580, 280);
  ctx.fillStyle = "#8b8f9c";
  ctx.font =
    "400 26px 'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Front-end developer", 580, 322);

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
      <mesh position={[0, 1.55, BEZEL_Z]}>
        <boxGeometry args={[3.3, 1.95, 0.12]} />
        <meshStandardMaterial
          color="#12141a"
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0.41, BEZEL_Z]}>
        <boxGeometry args={[0.25, 0.7, 0.12]} />
        <meshStandardMaterial color="#12141a" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.03, BEZEL_Z]}>
        <boxGeometry args={[1.2, 0.06, 0.7]} />
        <meshStandardMaterial
          color="#12141a"
          metalness={0.4}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, 1.55, SCREEN_Z]}>
        <planeGeometry args={[3.05, 1.78]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
}
