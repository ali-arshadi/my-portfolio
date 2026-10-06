"use client";

import { RoundedBox } from "@react-three/drei";
import { useLayoutEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

const PITCH = 0.116;
const GAP = 0.01;
const KEY_DEPTH = PITCH - GAP;
const KEY_HEIGHT = 0.042;
const CASE_HEIGHT = 0.052;
const DESK_TOP = 0.012;

type KeyCell = {
  label?: string;
  u: number;
};

type KeycapSpec = {
  id: string;
  label: string;
  width: number;
  x: number;
  y: number;
  z: number;
  legendW: number;
  legendH: number;
  homing: boolean;
};

const ROWS: KeyCell[][] = [
  [
    { label: "Esc", u: 1 },
    { u: 0.5 },
    { label: "F1", u: 1 },
    { label: "F2", u: 1 },
    { label: "F3", u: 1 },
    { label: "F4", u: 1 },
    { u: 0.25 },
    { label: "F5", u: 1 },
    { label: "F6", u: 1 },
    { label: "F7", u: 1 },
    { label: "F8", u: 1 },
    { u: 0.25 },
    { label: "F9", u: 1 },
    { label: "F10", u: 1 },
    { label: "F11", u: 1 },
    { label: "F12", u: 1 },
    { u: 0.25 },
    { label: "PrtSc", u: 1 },
    { label: "Del", u: 1 },
  ],
  [
    { label: "`", u: 1 },
    { label: "1", u: 1 },
    { label: "2", u: 1 },
    { label: "3", u: 1 },
    { label: "4", u: 1 },
    { label: "5", u: 1 },
    { label: "6", u: 1 },
    { label: "7", u: 1 },
    { label: "8", u: 1 },
    { label: "9", u: 1 },
    { label: "0", u: 1 },
    { label: "-", u: 1 },
    { label: "=", u: 1 },
    { label: "Backspace", u: 2 },
    { u: 0.25 },
    { label: "Home", u: 1 },
  ],
  [
    { label: "Tab", u: 1.5 },
    { label: "Q", u: 1 },
    { label: "W", u: 1 },
    { label: "E", u: 1 },
    { label: "R", u: 1 },
    { label: "T", u: 1 },
    { label: "Y", u: 1 },
    { label: "U", u: 1 },
    { label: "I", u: 1 },
    { label: "O", u: 1 },
    { label: "P", u: 1 },
    { label: "[", u: 1 },
    { label: "]", u: 1 },
    { label: "\\", u: 1.5 },
    { u: 0.25 },
    { label: "PgUp", u: 1 },
  ],
  [
    { label: "Caps\nLock", u: 1.75 },
    { label: "A", u: 1 },
    { label: "S", u: 1 },
    { label: "D", u: 1 },
    { label: "F", u: 1 },
    { label: "G", u: 1 },
    { label: "H", u: 1 },
    { label: "J", u: 1 },
    { label: "K", u: 1 },
    { label: "L", u: 1 },
    { label: ";", u: 1 },
    { label: "'", u: 1 },
    { label: "Enter", u: 2.25 },
    { u: 0.25 },
    { label: "PgDn", u: 1 },
  ],
  [
    { label: "Shift", u: 2.25 },
    { label: "Z", u: 1 },
    { label: "X", u: 1 },
    { label: "C", u: 1 },
    { label: "V", u: 1 },
    { label: "B", u: 1 },
    { label: "N", u: 1 },
    { label: "M", u: 1 },
    { label: ",", u: 1 },
    { label: ".", u: 1 },
    { label: "/", u: 1 },
    { label: "Shift", u: 1.75 },
    { u: 1 },
    { label: "↑", u:1 },
    { u: 1 },
  ],
  [
    { label: "Ctrl", u: 1.25 },
    { label: "Win", u: 1.25 },
    { label: "Alt", u: 1.25 },
    { label: "", u: 6.25 },
    { label: "Alt", u: 1 },
    { label: "Fn", u: 1 },
    { label: "Ctrl", u: 1 },
    { u: 1 },
    { label: "←", u: 1 },
    { label: "↓", u: 1 },
    { label: "→", u: 1 },
  ],
];

const ROW_LIFT = [0, 0.003, 0.007, 0.005, 0.002, 0.004];
const ARROW_LABELS = new Set(["←", "→", "↑", "↓"]);

function createLegendTexture(label: string, aspect: number) {
  const canvas = document.createElement("canvas");
  const height = 180;
  const width = Math.max(height, Math.round(height * aspect));
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d canvas context unavailable for key legends");
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#e6e1d6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (ARROW_LABELS.has(label)) {
    const direction = { "→": 0, "↓": Math.PI / 2, "←": Math.PI, "↑": -Math.PI / 2 }[
      label
    ]!;
    const length = Math.min(width, height) * 0.43;
    const shaft = length * 0.13;
    const head = length * 1.1;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(direction);
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(length - head, shaft * 1.65);
    ctx.lineTo(length - head, shaft);
    ctx.lineTo(-length * 0.9, shaft);
    ctx.lineTo(-length * 0.9, -shaft);
    ctx.lineTo(length - head, -shaft);
    ctx.lineTo(length - head, -shaft * 1.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }

  const lines = label.split("\n");
  const maxWidth = width * 0.84;
  let fontSize = lines.length > 1 ? 62 : 96;
  const font = (size: number) =>
    `600 ${size}px "Familjen Grotesk", ui-sans-serif, system-ui, sans-serif`;

  const fits = (size: number) => {
    ctx.font = font(size);
    return lines.every((line) => ctx.measureText(line).width <= maxWidth);
  };

  while (fontSize > 20 && !fits(fontSize)) {
    fontSize -= 2;
  }

  ctx.font = font(fontSize);
  const lineHeight = fontSize * 1.08;
  const blockHeight = lineHeight * lines.length;
  lines.forEach((line, index) => {
    const y = height / 2 - blockHeight / 2 + lineHeight * (index + 0.5);
    ctx.fillText(line, width / 2, y);
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function buildKeyboard() {
  const placed: KeycapSpec[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  ROWS.forEach((row, rowIndex) => {
    let cursor = 0;

    row.forEach((cell) => {
      const span = cell.u * PITCH;
      if (cell.label !== undefined) {
        const width = span - GAP;
        const x = cursor + span / 2;
        const z = rowIndex * PITCH + (rowIndex === 5 ? PITCH * 0.28 : 0);
        const isArrow = ARROW_LABELS.has(cell.label);
        const legendH = KEY_DEPTH * (isArrow ? 0.78 : 0.62);
        const legendW = Math.min(width * (isArrow ? 0.78 : 0.86), width - 0.008);
        placed.push({
          id: `${rowIndex}-${cursor}-${cell.label}`,
          label: cell.label,
          width,
          x,
          y: DESK_TOP + 0.07 + KEY_HEIGHT / 2 + (ROW_LIFT[rowIndex] ?? 0),
          z,
          legendW,
          legendH,
          homing: cell.label === "F" || cell.label === "J",
        });
        minX = Math.min(minX, x - width / 2);
        maxX = Math.max(maxX, x + width / 2);
        minZ = Math.min(minZ, z - KEY_DEPTH / 2);
        maxZ = Math.max(maxZ, z + KEY_DEPTH / 2);
      }
      cursor += span;
    });
  });

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const keys = placed.map((key) => ({
    ...key,
    x: key.x - centerX,
    z: key.z - centerZ,
  }));

  return {
    keys,
    caseWidth: maxX - minX + 0.16,
    caseDepth: maxZ - minZ + 0.15,
  };
}

function Keycap({
  spec,
  texture,
}: {
  spec: KeycapSpec;
  texture: CanvasTexture | null;
}) {
  return (
    <group position={[spec.x, spec.y, spec.z]}>
      <RoundedBox
        args={[spec.width, KEY_HEIGHT, KEY_DEPTH]}
        radius={0.008}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#2c313c"
          roughness={0.62}
          metalness={0.05}
        />
      </RoundedBox>
      {texture ? (
        <mesh
          position={[
            0,
            KEY_HEIGHT / 2 + 0.0012,
            ARROW_LABELS.has(spec.label) ? 0 : -KEY_DEPTH * 0.1,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[spec.legendW, spec.legendH]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={ARROW_LABELS.has(spec.label) ? 0.08 : 0.28}
            roughness={0.92}
            metalness={0}
            emissive="#e6e1d6"
            emissiveMap={texture}
            emissiveIntensity={ARROW_LABELS.has(spec.label) ? 0.9 : 0.42}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      ) : null}
      {spec.homing ? (
        <mesh position={[0, -KEY_HEIGHT * 0.22, KEY_DEPTH * 0.4]}>
          <boxGeometry args={[0.032, 0.006, 0.008]} />
          <meshStandardMaterial color="#454b5a" roughness={0.42} />
        </mesh>
      ) : null}
    </group>
  );
}

export function Keyboard() {
  const layout = useMemo(() => buildKeyboard(), []);
  const textures = useMemo(() => {
    const cache = new Map<string, CanvasTexture>();
    layout.keys.forEach((key) => {
      if (!key.label) return;
      const id = `${key.label}@${key.legendW.toFixed(3)}x${key.legendH.toFixed(3)}`;
      if (!cache.has(id)) {
        cache.set(
          id,
          createLegendTexture(key.label, key.legendW / key.legendH),
        );
      }
    });
    return cache;
  }, [layout.keys]);

  useLayoutEffect(
    () => () => {
      textures.forEach((texture) => texture.dispose());
    },
    [textures],
  );

  const textureFor = (key: KeycapSpec) => {
    if (!key.label) return null;
    const id = `${key.label}@${key.legendW.toFixed(3)}x${key.legendH.toFixed(3)}`;
    return textures.get(id) ?? null;
  };

  return (
    <group position={[0, 0.01, 1.16]} rotation={[-0.055, 0, 0]}>
      <RoundedBox
        args={[layout.caseWidth, CASE_HEIGHT, layout.caseDepth]}
        radius={0.028}
        smoothness={5}
        position={[0, DESK_TOP + CASE_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#16181e"
          roughness={0.38}
          metalness={0.55}
        />
      </RoundedBox>
      <RoundedBox
        args={[layout.caseWidth - 0.08, 0.012, layout.caseDepth - 0.08]}
        radius={0.012}
        smoothness={3}
        position={[0, DESK_TOP + CASE_HEIGHT - 0.004, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#0c0e13"
          roughness={0.72}
          metalness={0.2}
        />
      </RoundedBox>
      {layout.keys.map((key) => (
        <Keycap key={key.id} spec={key} texture={textureFor(key)} />
      ))}
    </group>
  );
}
