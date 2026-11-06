"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useSceneMode } from "./sceneMode";

const DeskCanvas = dynamic(() => import("./DeskCanvas"), { ssr: false });

// Mounts the scene only in 3D mode, so the static fallback never downloads three.js or the models.
// The mode is mirrored on <html data-scene> for the CSS that swaps the page sections and shows the
// loading line (globals.css); DeskCanvas marks data-scene-ready once everything has loaded.
export function DeskCanvasLoader() {
  const mode = useSceneMode();

  useEffect(() => {
    document.documentElement.dataset.scene = mode;
  }, [mode]);

  return mode === "3d" ? <DeskCanvas /> : null;
}
