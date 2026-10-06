"use client";

import { RoundedBox } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import {
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type InstancedMesh,
  type SpotLight,
} from "three";

RectAreaLightUniformsLib.init();

export const BACK_WALL = {
  x: -0.75,
  y: 1.06,
  z: -2.59,
  width: 8.8,
  height: 6.68,
  depth: 0.14,
} as const;

export const LEFT_WALL = {
  cornerX: -5.15,
  cornerZ: -2.52,
  yaw: Math.atan2(0.872, 0.493),
  length: 5.8,
  thickness: 0.12,
} as const;

const SHELF = {
  x: -1.55,
  y: 2.66,
  z: -2.3,
  width: 4.05,
  height: 0.17,
  depth: 0.4,
} as const;

export function roomShift(narrow: boolean) {
  return narrow ? { x: 2.05, y: 0.68, z: 0.12 } : { x: 0, y: 0, z: 0 };
}

function leftWallPoint(along: number, y: number, gap: number) {
  const yaw = LEFT_WALL.yaw;
  const half = LEFT_WALL.length / 2;
  const centerX = LEFT_WALL.cornerX - Math.cos(yaw) * half;
  const centerZ = LEFT_WALL.cornerZ + Math.sin(yaw) * half;
  return [
    centerX + Math.cos(yaw) * along + Math.sin(yaw) * gap,
    y,
    centerZ - Math.sin(yaw) * along + Math.cos(yaw) * gap,
  ] as const;
}

const SHELF_TOP = SHELF.y + SHELF.height / 2;

type BookSpec = {
  title: string;
  x: number;
  height: number;
  thickness: number;
  depth: number;
  color: string;
  yaw: number;
};

const BOOKS: readonly BookSpec[] = [
  {
    title: "Vue.js",
    x: -1.52,
    height: 0.48,
    thickness: 0.078,
    depth: 0.3,
    color: "#4a5160",
    yaw: 0.015,
  },
  {
    title: "Nuxt.js",
    x: -1.36,
    height: 0.56,
    thickness: 0.096,
    depth: 0.32,
    color: "#2a3344",
    yaw: -0.012,
  },
  {
    title: "React",
    x: -1.18,
    height: 0.5,
    thickness: 0.084,
    depth: 0.3,
    color: "#5c564e",
    yaw: 0.01,
  },
  {
    title: "TypeScript",
    x: -0.98,
    height: 0.62,
    thickness: 0.11,
    depth: 0.33,
    color: "#35322f",
    yaw: 0.02,
  },
  {
    title: "Design",
    x: -0.8,
    height: 0.44,
    thickness: 0.074,
    depth: 0.28,
    color: "#3e4654",
    yaw: -0.016,
  },
  {
    title: "Interfaces",
    x: -0.62,
    height: 0.52,
    thickness: 0.09,
    depth: 0.31,
    color: "#6a6158",
    yaw: 0.008,
  },
];

const SHELF_VINES: readonly (readonly (readonly [number, number, number])[])[] =
  [
    [
      [0.02, 0.16, 0.0],
      [0.12, 0.3, 0.05],
      [0.26, 0.1, 0.1],
      [0.32, -0.14, 0.14],
      [0.2, -0.38, 0.16],
    ],
    [
      [0.04, 0.14, 0.02],
      [0.18, 0.04, 0.08],
      [0.3, -0.18, 0.12],
      [0.36, -0.44, 0.15],
    ],
    [
      [-0.02, 0.18, 0.0],
      [-0.12, 0.26, 0.04],
      [0.02, 0.06, 0.08],
      [0.1, -0.24, 0.12],
    ],
    [
      [0.06, 0.18, -0.02],
      [0.2, 0.22, 0.04],
      [0.28, 0.02, 0.08],
      [0.22, -0.16, 0.11],
    ],
  ];

type LeafPlacement = {
  position: Vector3;
  quaternion: Quaternion;
  scale: number;
  color: Color;
};

const LEAF_A = new Color("#304734");
const LEAF_B = new Color("#38533b");
const LEAF_C = new Color("#2c4334");

function createPosterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d canvas context unavailable for poster");
  }

  ctx.fillStyle = "#1a181c";
  ctx.fillRect(0, 0, 1024, 1536);

  for (let i = 0; i < 2200; i += 1) {
    const x = (i * 97) % 1024;
    const y = (i * 53) % 1536;
    const alpha = 0.025 + (i % 5) * 0.008;
    ctx.fillStyle =
      i % 2 === 0 ? `rgba(255,248,236,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const lines = [
    { text: "Build", color: "#e8e2d6" },
    { text: "Ship", color: "#e8e2d6" },
    { text: "Improve", color: "#e8e2d6" },
    { text: "Repeat.", color: "#e0a15a" },
  ];

  ctx.textBaseline = "top";
  ctx.font =
    "600 168px 'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif";
  lines.forEach((line, index) => {
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, 96, 340 + index * 196);
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createSpineTexture(title: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d canvas context unavailable for book spine");
  }

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 512);
  ctx.translate(64, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#ddd6c8";
  ctx.font =
    "600 40px 'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createLeafGeometry() {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.055, 0.02, 0.078, 0.08, 0.028, 0.15);
  shape.bezierCurveTo(0.01, 0.19, 0, 0.21, 0, 0.23);
  shape.bezierCurveTo(0, 0.21, -0.01, 0.19, -0.028, 0.15);
  shape.bezierCurveTo(-0.078, 0.08, -0.055, 0.02, 0, 0);

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0012,
    bevelSegments: 1,
    curveSegments: 5,
  });
  geometry.translate(0, -0.01, -0.002);
  geometry.computeVertexNormals();
  return geometry;
}

function leafOnCurve(
  curve: CatmullRomCurve3,
  t: number,
  flip: number,
  scale: number,
  color: Color,
  roll: number,
): LeafPlacement {
  const position = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const facing = new Vector3(0.12, 0.02, 1).normalize();
  const side = new Vector3().crossVectors(facing, tangent);
  if (side.lengthSq() < 1e-4) {
    side.set(1, 0, 0);
  } else {
    side.normalize();
  }
  const normal = new Vector3().crossVectors(tangent, side).normalize();
  position.addScaledVector(normal, 0.02);
  position.addScaledVector(side, 0.02 * flip);
  const basis = new Matrix4().makeBasis(
    side.clone().multiplyScalar(flip),
    tangent,
    normal,
  );
  basis.multiply(new Matrix4().makeRotationY(roll));
  return {
    position,
    quaternion: new Quaternion().setFromRotationMatrix(basis),
    scale,
    color,
  };
}

function usePlantGeometry(
  paths: readonly (readonly (readonly [number, number, number])[])[],
  radius: number,
  crown: number,
) {
  return useMemo(() => {
    const curves = paths.map(
      (path) =>
        new CatmullRomCurve3(path.map(([x, y, z]) => new Vector3(x, y, z))),
    );
    const tubes = curves.map(
      (curve) => new TubeGeometry(curve, 20, radius, 4, false),
    );
    const leafGeometry = createLeafGeometry();
    const colors = [LEAF_A, LEAF_B, LEAF_C];
    const placements: LeafPlacement[] = [];

    curves.forEach((curve, curveIndex) => {
      const samples = curveIndex === 0 ? 5 : 4;
      for (let index = 0; index < samples; index += 1) {
        const t = 0.16 + (index / samples) * 0.78;
        placements.push(
          leafOnCurve(
            curve,
            t,
            index % 2 === 0 ? 1 : -1,
            1.05 + (index % 3) * 0.18,
            colors[(curveIndex + index) % colors.length],
            (index % 2 === 0 ? 0.35 : -0.4) + curveIndex * 0.08,
          ),
        );
      }
    });

    for (let index = 0; index < crown; index += 1) {
      const angle = (index / crown) * Math.PI * 2 + 0.35;
      placements.push({
        position: new Vector3(
          Math.cos(angle) * 0.055,
          0.14 + (index % 3) * 0.012,
          Math.sin(angle) * 0.045,
        ),
        quaternion: new Quaternion().setFromEuler(
          new Euler(
            -0.4 - (index % 3) * 0.12,
            angle,
            index % 2 === 0 ? 0.25 : -0.3,
          ),
        ),
        scale: 1.05 + (index % 4) * 0.12,
        color: colors[index % colors.length],
      });
    }

    return { tubes, leafGeometry, placements };
  }, [paths, radius, crown]);
}

function Poster() {
  const narrow = useThree((state) => state.size.width < 700);
  const texture = useMemo(() => createPosterTexture(), []);

  useLayoutEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const artW = narrow ? 1.22 : 1.72;
  const artH = narrow ? 1.72 : 2.4;
  const frame = 0.09;
  const shift = roomShift(narrow);
  const anchor = leftWallPoint(
    narrow ? 2.35 : 0.72,
    narrow ? 2.15 : 1.64,
    0.09,
  );
  const position = [
    anchor[0] + shift.x,
    anchor[1] + shift.y,
    anchor[2] + shift.z,
  ] as const;

  return (
    <group position={position} rotation={[0, LEFT_WALL.yaw, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[artW + frame * 2, artH + frame * 2, 0.07]} />
        <meshStandardMaterial
          color="#2a2724"
          roughness={0.58}
          metalness={0.28}
        />
      </mesh>
      <mesh position={[0, 0, 0.042]} receiveShadow>
        <planeGeometry args={[artW + 0.03, artH + 0.03]} />
        <meshStandardMaterial color="#121114" roughness={0.94} metalness={0} />
      </mesh>
      <mesh position={[0, 0, 0.05]} receiveShadow>
        <planeGeometry args={[artW, artH]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          roughness={0.92}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

function PosterSpill() {
  const narrow = useThree((state) => state.size.width < 700);
  const lightRef = useRef<SpotLight>(null);
  const targetRef = useRef<Object3D>(null);
  const shift = roomShift(narrow);
  const anchor = leftWallPoint(narrow ? 2.35 : 0.72, narrow ? 2.15 : 1.64, 0.2);
  const position = [
    anchor[0] + shift.x,
    anchor[1] + shift.y,
    anchor[2] + shift.z,
  ] as const;

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) {
      return;
    }
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, [narrow]);

  return (
    <group>
      <spotLight
        ref={lightRef}
        color="#ffc48a"
        intensity={8}
        distance={7.5}
        angle={1.25}
        penumbra={1}
        decay={2}
        position={[position[0] + 2.1, position[1] + 0.55, position[2] + 1.6]}
      />
      <rectAreaLight
        color="#ffc49a"
        intensity={28}
        width={3.6}
        height={3.1}
        position={[
          position[0] + Math.sin(LEFT_WALL.yaw) * 1.55,
          position[1] + 0.15,
          position[2] + Math.cos(LEFT_WALL.yaw) * 1.55,
        ]}
        rotation={[0, LEFT_WALL.yaw + Math.PI, 0]}
      />
      <object3D ref={targetRef} position={position} />
    </group>
  );
}

function createWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d canvas context unavailable for wood");
  }

  ctx.fillStyle = "#32261e";
  ctx.fillRect(0, 0, 512, 128);

  for (let i = 0; i < 46; i += 1) {
    const y = (i * 29) % 128;
    ctx.strokeStyle = i % 3 === 0 ? "rgba(86,58,38,0.55)" : "rgba(18,12,8,0.4)";
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 28) {
      ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 2.2);
    }
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.4, 1);
  texture.needsUpdate = true;
  return texture;
}

function Shelf() {
  const wood = useMemo(() => createWoodTexture(), []);

  useLayoutEffect(() => {
    return () => {
      wood.dispose();
    };
  }, [wood]);

  return (
    <RoundedBox
      args={[SHELF.width, SHELF.height, SHELF.depth]}
      radius={0.014}
      smoothness={3}
      position={[SHELF.x, SHELF.y, SHELF.z]}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        map={wood}
        color="#ffffff"
        roughness={0.62}
        metalness={0.02}
        clearcoat={0.14}
        clearcoatRoughness={0.58}
      />
    </RoundedBox>
  );
}

function useBookMaterials(spec: BookSpec) {
  const bundle = useMemo(() => {
    const texture = createSpineTexture(spec.title, spec.color);
    const side = new MeshStandardMaterial({
      color: spec.color,
      roughness: 0.76,
      metalness: 0.02,
    });
    const pages = new MeshStandardMaterial({
      color: "#a39888",
      roughness: 0.84,
      metalness: 0,
    });
    const spine = new MeshStandardMaterial({
      map: texture,
      roughness: 0.72,
      metalness: 0.02,
    });
    return {
      texture,
      materials: [side, side, pages, side, spine, side],
    };
  }, [spec]);

  useLayoutEffect(() => {
    const { texture, materials } = bundle;
    return () => {
      texture.dispose();
      new Set(materials).forEach((material) => material.dispose());
    };
  }, [bundle]);

  return bundle.materials;
}

function Book({ spec }: { spec: BookSpec }) {
  const materials = useBookMaterials(spec);

  return (
    <mesh
      position={[SHELF.x + spec.x, SHELF_TOP + spec.height / 2, SHELF.z + 0.04]}
      rotation={[0, spec.yaw, 0]}
      material={materials}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[spec.thickness, spec.height, spec.depth]} />
    </mesh>
  );
}

function Books() {
  return (
    <group>
      {BOOKS.map((book) => (
        <Book key={book.title} spec={book} />
      ))}
    </group>
  );
}

function DecorativeObject() {
  return (
    <group position={[SHELF.x - 0.08, SHELF_TOP, SHELF.z + 0.04]} scale={2}>
      <mesh position={[0, 0.012, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.09, 0.098, 0.022, 20]} />
        <meshStandardMaterial
          color="#3e3a36"
          roughness={0.72}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <capsuleGeometry args={[0.042, 0.07, 4, 8]} />
        <meshStandardMaterial color="#5c564e" roughness={0.84} metalness={0} />
      </mesh>
      <mesh position={[0, 0.205, 0.008]} castShadow>
        <sphereGeometry args={[0.046, 16, 12]} />
        <meshStandardMaterial color="#6a6258" roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[-0.028, 0.242, 0.006]} rotation={[0, 0, 0.4]} castShadow>
        <coneGeometry args={[0.016, 0.028, 6]} />
        <meshStandardMaterial color="#4e4943" roughness={0.82} metalness={0} />
      </mesh>
      <mesh position={[0.028, 0.242, 0.006]} rotation={[0, 0, -0.4]} castShadow>
        <coneGeometry args={[0.016, 0.028, 6]} />
        <meshStandardMaterial color="#4e4943" roughness={0.82} metalness={0} />
      </mesh>
      <mesh position={[-0.07, 0.09, 0.01]} rotation={[0.2, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.012, 0.04, 3, 6]} />
        <meshStandardMaterial color="#534e48" roughness={0.84} metalness={0} />
      </mesh>
      <mesh
        position={[0.068, 0.095, 0.02]}
        rotation={[0.4, 0.2, -0.7]}
        castShadow
      >
        <capsuleGeometry args={[0.012, 0.045, 3, 6]} />
        <meshStandardMaterial color="#534e48" roughness={0.84} metalness={0} />
      </mesh>
    </group>
  );
}

function VinePlant({
  paths,
  radius,
  crown,
  leafScale = 1,
}: {
  paths: readonly (readonly (readonly [number, number, number])[])[];
  radius: number;
  crown: number;
  leafScale?: number;
}) {
  const leavesRef = useRef<InstancedMesh>(null);
  const { tubes, leafGeometry, placements } = usePlantGeometry(
    paths,
    radius,
    crown,
  );

  useLayoutEffect(() => {
    const mesh = leavesRef.current;
    if (!mesh) {
      return;
    }

    const dummy = new Object3D();
    placements.forEach((leaf, index) => {
      dummy.position.copy(leaf.position);
      dummy.quaternion.copy(leaf.quaternion);
      dummy.scale.setScalar(leaf.scale * leafScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, leaf.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.computeBoundingSphere();
  }, [leafScale, placements]);

  useLayoutEffect(() => {
    return () => {
      leafGeometry.dispose();
      tubes.forEach((tube) => tube.dispose());
    };
  }, [leafGeometry, tubes]);

  return (
    <group>
      {tubes.map((tube, index) => (
        <mesh key={index} geometry={tube} castShadow>
          <meshStandardMaterial
            color="#243628"
            roughness={0.78}
            metalness={0}
          />
        </mesh>
      ))}
      <instancedMesh
        ref={leavesRef}
        args={[leafGeometry, undefined, placements.length]}
        frustumCulled={false}
      >
        <meshPhysicalMaterial
          roughness={0.68}
          metalness={0}
          clearcoat={0.08}
          clearcoatRoughness={0.62}
          side={DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}

function ShelfPlant() {
  return (
    <group position={[SHELF.x + 1.42, SHELF_TOP, SHELF.z + 0.03]}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.086, 0.16, 18]} />
        <meshStandardMaterial color="#6a6258" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 0.158, 0]} castShadow>
        <cylinderGeometry args={[0.122, 0.112, 0.022, 18]} />
        <meshStandardMaterial color="#7c746a" roughness={0.82} metalness={0} />
      </mesh>
      <mesh position={[0, 0.164, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 18]} />
        <meshStandardMaterial color="#1a1917" roughness={1} metalness={0} />
      </mesh>
      <VinePlant paths={SHELF_VINES} radius={0.009} crown={8} />
    </group>
  );
}

function createWallGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d canvas context unavailable for shelf glow");
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "rgba(255, 176, 110, 0)");
  gradient.addColorStop(0.18, "rgba(255, 176, 110, 0.015)");
  gradient.addColorStop(0.42, "rgba(255, 176, 110, 0.07)");
  gradient.addColorStop(0.68, "rgba(255, 176, 110, 0.02)");
  gradient.addColorStop(1, "rgba(255, 176, 110, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 256);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function ShelfLight() {
  const texture = useMemo(() => createWallGlowTexture(), []);

  useLayoutEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const wallZ = BACK_WALL.z + BACK_WALL.depth / 2 + 0.01;

  return (
    <group>
      <mesh position={[SHELF.x, SHELF.y - 0.72, wallZ]}>
        <planeGeometry args={[SHELF.width - 0.15, 1.45]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          toneMapped
        />
      </mesh>
      <mesh
        position={[SHELF.x, SHELF.y - SHELF.height / 2 - 0.008, SHELF.z + 0.08]}
      >
        <boxGeometry args={[SHELF.width - 0.28, 0.012, 0.028]} />
        <meshStandardMaterial
          color="#4a321c"
          emissive="#ffb06a"
          emissiveIntensity={0.42}
          roughness={0.74}
          metalness={0}
        />
      </mesh>
      <rectAreaLight
        color="#ffb06a"
        intensity={55}
        width={SHELF.width - 0.4}
        height={0.16}
        position={[SHELF.x, SHELF.y - SHELF.height / 2 - 0.05, SHELF.z + 0.06]}
        rotation={[Math.PI / 2 + 0.7, 0, 0]}
      />
      <rectAreaLight
        color="#d7b48a"
        intensity={14}
        width={6.4}
        height={2.8}
        position={[SHELF.x + 0.35, SHELF.y + 0.15, -1.05]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

export function WallDecor() {
  const narrow = useThree((state) => state.size.width < 700);

  return (
    <group>
      <Poster />
      <PosterSpill />
      <group position={[narrow ? -0.55 : 0, 0, 0]}>
        <Shelf />
        <Books />
        <DecorativeObject />
        <ShelfPlant />
        <ShelfLight />
      </group>
    </group>
  );
}
