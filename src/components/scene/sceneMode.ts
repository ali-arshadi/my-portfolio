"use client";

import { useSyncExternalStore } from "react";
import { SCENE_MEDIA } from "./sceneMedia";

export { SCENE_MEDIA };

// How the hero is shown:
//   3d       the live scene, the scroll-driven camera and the portfolio on the monitor (desktop)
//   static   the site only, no scene: phones, tablets, and browsers without WebGL 2
//   pending  on the server and before hydration: nothing else is decided yet
export type SceneMode = "3d" | "static" | "pending";

let webgl2: boolean | undefined;
function hasWebGL2() {
  if (webgl2 === undefined) {
    const gl = document.createElement("canvas").getContext("webgl2");
    webgl2 = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return webgl2;
}

function subscribe(onChange: () => void) {
  const m = window.matchMedia(SCENE_MEDIA);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

function snapshot(): SceneMode {
  return window.matchMedia(SCENE_MEDIA).matches && hasWebGL2()
    ? "3d"
    : "static";
}

export function useSceneMode(): SceneMode {
  return useSyncExternalStore(subscribe, snapshot, () => "pending");
}
