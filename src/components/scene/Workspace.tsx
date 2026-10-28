"use client";

import { useGLTF } from "@react-three/drei";
import { MODELS } from "@/config/scene";

function Asset({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export function Workspace() {
  return (
    <>
      {Object.values(MODELS).map((url) => (
        <Asset key={url} url={url} />
      ))}
    </>
  );
}

Object.values(MODELS).forEach((url) => useGLTF.preload(url));
