"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  CatmullRomCurve3,
  DoubleSide,
  LatheGeometry,
  Matrix4,
  Quaternion,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  type Object3D,
  type SpotLight,
} from "three";

type Vec3 = [number, number, number];

const LAMP_POSITION: Vec3 = [-3.48, 0.01, 0.36];
const PIVOT: Vec3 = [0, 0.28, 0];
const ELBOW: Vec3 = [0.18, 0.96, 0.5];
const HEAD: Vec3 = [0.7, 1.62, 0.04];
const TARGET: Vec3 = [-0.55, 0.04, 1.12];

const AIM: Vec3 = [
  TARGET[0] - LAMP_POSITION[0] - HEAD[0],
  TARGET[1] - LAMP_POSITION[1] - HEAD[1],
  TARGET[2] - LAMP_POSITION[2] - HEAD[2],
];

const SHADE_OUTER: ReadonlyArray<readonly [number, number]> = [
  [0.02, 0.03],
  [0.09, 0.02],
  [0.12, -0.02],
  [0.2, -0.1],
  [0.32, -0.2],
  [0.42, -0.3],
  [0.48, -0.37],
  [0.5, -0.4],
  [0.45, -0.43],
];

const SHADE_INNER: ReadonlyArray<readonly [number, number]> = [
  [0.015, 0.01],
  [0.07, 0.008],
  [0.1, -0.03],
  [0.175, -0.11],
  [0.295, -0.21],
  [0.39, -0.31],
  [0.445, -0.38],
];

const PAINT = "#3c414c";
const PAINT_DARK = "#2a2e36";

function add(a: Vec3, b: Vec3, scale = 1): Vec3 {
  return [a[0] + b[0] * scale, a[1] + b[1] * scale, a[2] + b[2] * scale];
}

function linkageNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const v1: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v2: Vec3 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const normal: Vec3 = [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0],
  ];
  const length = Math.hypot(...normal) || 1;
  return [normal[0] / length, normal[1] / length, normal[2] / length];
}

function insetSegment(a: Vec3, b: Vec3, amount: number): [Vec3, Vec3] {
  const delta: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const length = Math.hypot(...delta) || 1;
  const direction: Vec3 = [
    delta[0] / length,
    delta[1] / length,
    delta[2] / length,
  ];
  return [add(a, direction, amount), add(b, direction, -amount)];
}

const AXIS = linkageNormal(PIVOT, ELBOW, HEAD);
const BAR_GAP = 0.05;
const SPRING_SIDE = AXIS[2] >= 0 ? 0.16 : -0.16;
const LOWER = insetSegment(PIVOT, ELBOW, 0.08);
const UPPER = insetSegment(ELBOW, HEAD, 0.08);

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

const SPRING_START = add(mix(PIVOT, ELBOW, 0.14), AXIS, SPRING_SIDE);
const SPRING_END = add(mix(PIVOT, ELBOW, 0.86), AXIS, SPRING_SIDE);
const SPRING_MOUNT_START = add(mix(PIVOT, ELBOW, 0.14), AXIS, BAR_GAP);
const SPRING_MOUNT_END = add(mix(PIVOT, ELBOW, 0.86), AXIS, BAR_GAP);
const LOWER_BARS: Vec3[][] = [-BAR_GAP, BAR_GAP].map((gap) => [
  add(LOWER[0], AXIS, gap),
  add(LOWER[1], AXIS, gap),
]);
const UPPER_BARS: Vec3[][] = [-BAR_GAP, BAR_GAP].map((gap) => [
  add(UPPER[0], AXIS, gap),
  add(UPPER[1], AXIS, gap),
]);

function useLathe(profile: ReadonlyArray<readonly [number, number]>) {
  const geometry = useMemo(
    () =>
      new LatheGeometry(
        profile.map(([radius, y]) => new Vector2(radius, y)),
        64,
      ),
    [profile],
  );

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  return geometry;
}

function Bar({
  a,
  b,
  normal,
  width = 0.06,
  thickness = 0.012,
}: {
  a: Vec3;
  b: Vec3;
  normal: Vec3;
  width?: number;
  thickness?: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new Vector3(...a);
    const end = new Vector3(...b);
    const direction = end.clone().sub(start);
    const span = direction.length();
    direction.normalize();
    const hinge = new Vector3(...normal);
    hinge.addScaledVector(direction, -hinge.dot(direction)).normalize();
    const wide = new Vector3().crossVectors(direction, hinge).normalize();
    const quaternion = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(wide, direction, hinge),
    );
    return {
      position: start.add(end).multiplyScalar(0.5),
      quaternion,
      length: span,
    };
  }, [a, b, normal]);

  return (
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow>
      <boxGeometry args={[width, Math.max(length, 0.001), thickness]} />
      <meshStandardMaterial color={PAINT} roughness={0.46} metalness={0.22} />
    </mesh>
  );
}

function Hinge({ position, axis }: { position: Vec3; axis: Vec3 }) {
  const quaternion = useMemo(
    () =>
      new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        new Vector3(...axis).normalize(),
      ),
    [axis],
  );

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.07, 28, 28]} />
        <meshStandardMaterial
          color="#1a1d24"
          roughness={0.42}
          metalness={0.35}
        />
      </mesh>
      <group quaternion={quaternion}>
        <mesh castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.2, 12]} />
          <meshStandardMaterial
            color="#0e1014"
            roughness={0.3}
            metalness={0.72}
          />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, side * 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.016, 14]} />
            <meshStandardMaterial
              color="#8e949f"
              roughness={0.28}
              metalness={0.84}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Spring({ a, b }: { a: Vec3; b: Vec3 }) {
  const geometry = useMemo(() => {
    const from = new Vector3(...a);
    const to = new Vector3(...b);
    const delta = to.clone().sub(from);
    const length = delta.length();
    const direction = delta.normalize();
    const helper =
      Math.abs(direction.y) > 0.92
        ? new Vector3(1, 0, 0)
        : new Vector3(0, 1, 0);
    const side = new Vector3().crossVectors(direction, helper).normalize();
    const binormal = new Vector3().crossVectors(side, direction).normalize();
    const coils = 14;
    const radius = 0.028;
    const steps = coils * 8;
    const points: Vector3[] = [from.clone()];

    for (let index = 0; index <= steps; index += 1) {
      const t = index / steps;
      const angle = t * coils * Math.PI * 2;
      points.push(
        from
          .clone()
          .addScaledVector(direction, length * t)
          .addScaledVector(side, Math.cos(angle) * radius)
          .addScaledVector(binormal, Math.sin(angle) * radius),
      );
    }

    points.push(to.clone());
    return new TubeGeometry(
      new CatmullRomCurve3(points),
      steps,
      0.0055,
      6,
      false,
    );
  }, [a, b]);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color="#d5d8e0" roughness={0.22} metalness={0.88} />
    </mesh>
  );
}

function Shade() {
  const lightRef = useRef<SpotLight>(null);
  const targetRef = useRef<Object3D>(null);
  const outer = useLathe(SHADE_OUTER);
  const inner = useLathe(SHADE_INNER);
  const reflector = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2d canvas context unavailable for lamp shade");
    }

    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, "#fff4df");
    gradient.addColorStop(0.22, "#ffd59a");
    gradient.addColorStop(0.55, "#e08a3a");
    gradient.addColorStop(1, "#6d431c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);
  const quaternion = useMemo(
    () =>
      new Quaternion().setFromUnitVectors(
        new Vector3(0, -1, 0),
        new Vector3(...AIM).normalize(),
      ),
    [],
  );

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  useLayoutEffect(() => () => reflector.dispose(), [reflector]);

  return (
    <group position={HEAD} quaternion={quaternion}>
      <mesh geometry={outer} castShadow receiveShadow>
        <meshStandardMaterial
          color={PAINT_DARK}
          roughness={0.52}
          metalness={0.18}
          side={DoubleSide}
        />
      </mesh>
      <mesh geometry={inner}>
        <meshStandardMaterial
          map={reflector}
          color="#fff6ea"
          emissive="#ffb454"
          emissiveMap={reflector}
          emissiveIntensity={0.72}
          roughness={0.62}
          metalness={0}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.49, 0.016, 12, 64]} />
        <meshStandardMaterial
          color="#12141a"
          roughness={0.32}
          metalness={0.7}
        />
      </mesh>

      <mesh position={[0, -0.2, 0]}>
        <sphereGeometry args={[0.042, 24, 24]} />
        <meshStandardMaterial
          color="#fff6e6"
          emissive="#ffc56e"
          emissiveIntensity={2.6}
          roughness={0.3}
        />
      </mesh>

      <pointLight
        color="#ffb454"
        intensity={5}
        distance={3}
        decay={2}
        position={[0, -0.18, 0]}
      />
      <spotLight
        ref={lightRef}
        color="#ffb454"
        intensity={32}
        distance={7.5}
        angle={0.5}
        penumbra={0.8}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        position={[0, -0.32, 0]}
      />
      <object3D ref={targetRef} position={[0, -3.6, 0]} />
    </group>
  );
}

function Linkage() {
  return (
    <group>
      <Hinge position={PIVOT} axis={AXIS} />
      <Hinge position={ELBOW} axis={AXIS} />
      <Hinge position={HEAD} axis={AXIS} />

      {LOWER_BARS.map(([a, b]) => (
        <Bar key={`lower-${a[0]}`} a={a} b={b} normal={AXIS} />
      ))}
      {UPPER_BARS.map(([a, b]) => (
        <Bar key={`upper-${a[0]}`} a={a} b={b} normal={AXIS} />
      ))}

      <Bar
        a={SPRING_MOUNT_START}
        b={SPRING_START}
        normal={AXIS}
        width={0.012}
        thickness={0.012}
      />
      <Bar
        a={SPRING_MOUNT_END}
        b={SPRING_END}
        normal={AXIS}
        width={0.012}
        thickness={0.012}
      />
      <Spring a={SPRING_START} b={SPRING_END} />
    </group>
  );
}

export function Lamp() {
  const cord = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(0.12, 0.05, 0.28),
      new Vector3(0.28, 0.016, 0.52),
      new Vector3(0.62, 0.012, 0.7),
      new Vector3(0.95, 0.012, 0.48),
    ]);
    return new TubeGeometry(curve, 36, 0.011, 6, false);
  }, []);

  useLayoutEffect(() => () => cord.dispose(), [cord]);

  return (
    <group position={LAMP_POSITION}>
      <mesh position={[0, 0.008, 0]} receiveShadow>
        <cylinderGeometry args={[0.44, 0.44, 0.016, 48]} />
        <meshStandardMaterial color="#101114" roughness={0.96} metalness={0} />
      </mesh>
      <mesh position={[0, 0.055, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.37, 0.41, 0.078, 48]} />
        <meshStandardMaterial
          color="#343842"
          roughness={0.48}
          metalness={0.28}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.365, 0.012, 10, 48]} />
        <meshStandardMaterial color="#6d7380" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.118, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.34, 0.04, 40]} />
        <meshStandardMaterial
          color={PAINT_DARK}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.21, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.034, 0.04, 0.15, 20]} />
        <meshStandardMaterial color={PAINT} roughness={0.42} metalness={0.24} />
      </mesh>

      <mesh position={[0.16, 0.125, 0.18]} castShadow>
        <boxGeometry args={[0.055, 0.02, 0.034]} />
        <meshStandardMaterial
          color="#15171c"
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0.16, 0.138, 0.18]}>
        <sphereGeometry args={[0.007, 12, 12]} />
        <meshStandardMaterial
          color="#ffb454"
          emissive="#ffb454"
          emissiveIntensity={1.6}
        />
      </mesh>

      <mesh geometry={cord} castShadow receiveShadow>
        <meshStandardMaterial color="#16181d" roughness={0.88} metalness={0} />
      </mesh>

      <Linkage />
      <Shade />
    </group>
  );
}
