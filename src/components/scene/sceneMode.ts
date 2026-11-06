"use client";

import { useSyncExternalStore } from "react";

// How the hero is shown:
//   3d       the live scene, the scroll-driven camera and the portfolio on the monitor
//   static   the rendered opening frame and the sections below it: narrow screens (the monitor's text
//            would be too small to read, and a phone should not download the scene) and browsers
//            without WebGL 2
//   pending  on the server and before hydration: the still frame shows, nothing else is decided yet
export type SceneMode = "3d" | "static" | "pending";

// The width from which the scene (and the content on its monitor) is used.
export const SCENE_MEDIA = "(min-width: 900px)";

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
