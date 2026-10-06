"use client";

import { RoundedBox } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
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
  Shape,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type InstancedMesh,
} from "three";

const SHELF = {
  x: -0.05,
  y: 2.78,
  z: -2.74,
  width: 4.55,
  height: 0.16,
  depth: 0.42,
} as const;

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
    x: -1.92,
    height: 0.48,
    thickness: 0.078,
    depth: 0.3,
    color: "#3a3e48",
    yaw: 0.015,
  },
  {
    title: "Nuxt.js",
    x: -1.8,
    height: 0.56,
    thickness: 0.096,
    depth: 0.32,
    color: "#343a46",
    yaw: -0.012,
  },
  {
    title: "React",
    x: -1.66,
    height: 0.5,
    thickness: 0.084,
    depth: 0.3,
    color: "#3e3c40",
    yaw: 0.01,
  },
  {
    title: "TypeScript",
    x: -1.5,
    height: 0.62,
    thickness: 0.11,
    depth: 0.33,
    color: "#2e3644",
    yaw: 0.02,
  },
  {
    title: "Design",
    x: -1.36,
    height: 0.44,
    thickness: 0.074,
    depth: 0.28,
    color: "#3c3a40",
    yaw: -0.016,
  },
  {
    title: "Interfaces",
    x: -1.22,
    height: 0.52,
    thickness: 0.09,
    depth: 0.31,
    color: "#363940",
    yaw: 0.008,
  },
];

const SHELF_VINES: readonly (readonly (readonly [number, number, number])[])[] =
  [
    [
      [0.02, 0.18, 0.0],
      [0.14, 0.36, 0.06],
      [0.3, 0.16, 0.12],
      [0.38, -0.16, 0.18],
      [0.24, -0.58, 0.22],
    ],
    [
      [0.04, 0.16, 0.02],
      [0.2, 0.06, 0.1],
      [0.34, -0.28, 0.16],
      [0.46, -0.72, 0.2],
    ],
    [
      [-0.02, 0.2, 0.0],
      [-0.14, 0.32, 0.05],
      [0.02, 0.1, 0.1],
      [0.12, -0.38, 0.16],
    ],
    [
      [0.08, 0.22, -0.02],
      [0.24, 0.3, 0.04],
      [0.36, 0.06, 0.1],
      [0.3, -0.24, 0.14],
    ],
  ];

type LeafPlacement = {
  position: Vector3;
  quaternion: Quaternion;
  scale: number;
  color: Color;
};

const LEAF_A = new Color("#304732");
const LEAF_B = new Color("#3a5640");
const LEAF_C = new Color("#2a4030");

function createPosterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d canvas context unavailable for poster");
  }

  ctx.fillStyle = "#121014";
  ctx.fillRect(0, 0, 1024, 1536);

  const lines = [
    { text: "Build", color: "#e7e0d4" },
    { text: "Ship", color: "#e7e0d4" },
    { text: "Improve", color: "#e7e0d4" },
    { text: "Repeat.", color: "#ffb454" },
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

  const artW = narrow ? 1.9 : 2.4;
  const artH = narrow ? 2.7 : 3.2;
  const frame = 0.07;

  return (
    <group position={[narrow ? -4.15 : -6.5, narrow ? 2.05 : 2.12, -3.04]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[artW + frame * 2, artH + frame * 2, 0.045]} />
        <meshStandardMaterial
          color="#3a342e"
          roughness={0.62}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, 0, 0.026]} receiveShadow>
        <planeGeometry args={[artW, artH]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          roughness={0.78}
          metalness={0}
        />
      </mesh>
      <pointLight
        color="#ffb454"
        intensity={3.1}
        distance={5.5}
        decay={2}
        position={[0.85, -0.55, 2.2]}
      />
    </group>
  );
}

function Shelf() {
  return (
    <RoundedBox
      args={[SHELF.width, SHELF.height, SHELF.depth]}
      radius={0.012}
      smoothness={3}
      position={[SHELF.x, SHELF.y, SHELF.z]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color="#3a2c22" roughness={0.58} metalness={0.04} />
    </RoundedBox>
  );
}

function useBookMaterials(spec: BookSpec) {
  const bundle = useMemo(() => {
    const texture = createSpineTexture(spec.title, spec.color);
    const side = new MeshStandardMaterial({
      color: spec.color,
      roughness: 0.8,
      metalness: 0.02,
    });
    const pages = new MeshStandardMaterial({
      color: "#4a453c",
      roughness: 0.9,
      metalness: 0,
    });
    const spine = new MeshStandardMaterial({
      map: texture,
      roughness: 0.74,
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
      position={[spec.x, SHELF_TOP + spec.height / 2, -2.66]}
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
    <group position={[-0.42, SHELF_TOP, -2.66]} scale={2}>
      <mesh position={[0, 0.012, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.09, 0.098, 0.022, 20]} />
        <meshStandardMaterial
          color="#2a2826"
          roughness={0.48}
          metalness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <capsuleGeometry args={[0.042, 0.07, 4, 8]} />
        <meshStandardMaterial
          color="#2c2c2c"
          roughness={0.7}
          metalness={0.06}
        />
      </mesh>
      <mesh position={[0, 0.205, 0.008]} castShadow>
        <sphereGeometry args={[0.046, 16, 12]} />
        <meshStandardMaterial
          color="#262626"
          roughness={0.68}
          metalness={0.06}
        />
      </mesh>
      <mesh position={[-0.028, 0.242, 0.006]} rotation={[0, 0, 0.4]} castShadow>
        <coneGeometry args={[0.016, 0.028, 6]} />
        <meshStandardMaterial
          color="#242424"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0.028, 0.242, 0.006]} rotation={[0, 0, -0.4]} castShadow>
        <coneGeometry args={[0.016, 0.028, 6]} />
        <meshStandardMaterial
          color="#242424"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[-0.07, 0.09, 0.01]} rotation={[0.2, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.012, 0.04, 3, 6]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.72}
          metalness={0.05}
        />
      </mesh>
      <mesh
        position={[0.068, 0.095, 0.02]}
        rotation={[0.4, 0.2, -0.7]}
        castShadow
      >
        <capsuleGeometry args={[0.012, 0.045, 3, 6]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.72}
          metalness={0.05}
        />
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
            color="#2c4030"
            roughness={0.82}
            metalness={0}
          />
        </mesh>
      ))}
      <instancedMesh
        ref={leavesRef}
        args={[leafGeometry, undefined, placements.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          roughness={0.76}
          metalness={0}
          side={DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}

function ShelfPlant() {
  return (
    <group position={[1.38, SHELF_TOP, -2.64]}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.086, 0.16, 18]} />
        <meshStandardMaterial
          color="#34312e"
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[0, 0.158, 0]} castShadow>
        <cylinderGeometry args={[0.122, 0.112, 0.022, 18]} />
        <meshStandardMaterial
          color="#3e3a36"
          roughness={0.8}
          metalness={0.04}
        />
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
  gradient.addColorStop(0, "rgba(255, 180, 84, 0)");
  gradient.addColorStop(0.22, "rgba(255, 180, 84, 0.03)");
  gradient.addColorStop(0.46, "rgba(255, 180, 84, 0.16)");
  gradient.addColorStop(0.64, "rgba(255, 180, 84, 0.05)");
  gradient.addColorStop(1, "rgba(255, 180, 84, 0)");
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

  return (
    <group>
      <mesh position={[SHELF.x, SHELF.y - 0.48, -3.12]}>
        <planeGeometry args={[SHELF.width - 0.2, 0.72]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          toneMapped
        />
      </mesh>
      <mesh
        position={[SHELF.x, SHELF.y - SHELF.height / 2 - 0.01, SHELF.z + 0.04]}
      >
        <boxGeometry args={[SHELF.width - 0.35, 0.012, 0.035]} />
        <meshStandardMaterial
          color="#4a321c"
          emissive="#ffb454"
          emissiveIntensity={0.28}
          roughness={0.72}
          metalness={0}
        />
      </mesh>
      <pointLight
        color="#ffb454"
        intensity={2.6}
        distance={1.05}
        decay={2}
        position={[SHELF.x - 0.35, SHELF.y + 0.02, SHELF.z + 0.48]}
      />
    </group>
  );
}

export function WallDecor() {
  const narrow = useThree((state) => state.size.width < 700);

  return (
    <group>
      <Poster />
      <group position={[narrow ? -2.05 : 0, 0, 0]}>
        <Shelf />
        <Books />
        <DecorativeObject />
        <ShelfPlant />
        <ShelfLight />
      </group>
    </group>
  );
}
