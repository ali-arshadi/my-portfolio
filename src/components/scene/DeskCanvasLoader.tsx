"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useSceneMode } from "./sceneMode";

const DeskCanvas = dynamic(() => import("./DeskCanvas"), { ssr: false });

// Mounts the scene only in 3D mode, so the static fallback never downloads three.js or the models.
// The mode is mirrored on <html data-scene> for the CSS that swaps the page sections and shows the
// loader (globals.css); DeskCanvas marks data-scene-ready once everything has loaded.
export function DeskCanvasLoader() {
  const mode = useSceneMode();

  // keeps data-scene current when the window crosses the width threshold (the inline script in the
  // layout set it before the first paint; "pending" is only the hydration pass and is not written)
  useEffect(() => {
    if (mode !== "pending") {
      document.documentElement.dataset.scene = mode;
    }
  }, [mode]);

  return mode === "3d" ? <DeskCanvas /> : null;
}
