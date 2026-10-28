"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect } from "react";
import { HIT_TARGET_SUFFIX, MODELS } from "@/config/scene";

function Asset({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useLayoutEffect(() => {
    scene.traverse((object) => {
      if (object.name.endsWith(HIT_TARGET_SUFFIX)) {
        object.visible = false;
      }
    });
  }, [scene]);

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
