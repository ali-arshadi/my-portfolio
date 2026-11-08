"use client";

import { Suspense } from "react";
import { MonitorScreen } from "@/components/screen/MonitorScreen";
import { CameraRig } from "./CameraRig";
import { DebugView } from "./DebugView";
import { Effects } from "./Effects";
import { LampSwitch } from "./LampSwitch";
import { Lighting } from "./Lighting";
import { SceneHotspots } from "./SceneHotspots";
import { ScenePointer } from "./ScenePointer";
import { SceneMotion } from "./SceneMotion";
import { ShelfObjects } from "./ShelfObjects";
import { Workspace } from "./Workspace";

export function Experience() {
  return (
    <>
      <color attach="background" args={["#08090c"]} />

      <CameraRig />
      <DebugView />
      <Lighting />
      <Suspense fallback={null}>
        <Workspace />
        <MonitorScreen />
      </Suspense>
      <SceneMotion />
      <ScenePointer />
      <LampSwitch />
      <ShelfObjects />
      <SceneHotspots />
      <Effects />
    </>
  );
}
