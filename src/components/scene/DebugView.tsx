"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  Box3,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  type Material,
  type MeshStandardMaterial,
  type Scene,
  type Texture,
  Vector3,
} from "three";
import { evaluateCamera } from "@/config/camera";
import { HIT_TARGET_SUFFIX } from "@/config/scene";
import { lampLevel } from "./lampState";

// Calibration aids:
// `?view=normals` shades every surface by its facing direction, so walls, desk and floor read as flat
// colours with crisp edges regardless of lighting.
// `?view=lightmap` / `?view=lampmap` show only the baked base / lamp layer, as the site maps them.
// `?lamp=off` (or a number from 0 to 1) sets the desk lamp's level.
// `?view=path` checks the scroll camera path against every mesh's bounding box and logs the closest
// approach (also on `window.cameraPathClearance`).
export function DebugView() {
  const get = useThree((state) => state.get);

  useEffect(() => {
    const lamp = new URLSearchParams(window.location.search).get("lamp");
    if (lamp !== null) {
      lampLevel.value =
        lamp === "off" ? 0 : Math.min(1, Math.max(0, Number(lamp) || 0));
    }
  }, []);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "lightmap" || view === "lampmap") {
      return showLightmaps(get().scene, view);
    }
    if (view === "path") {
      return checkPath(get().scene);
    }
    if (view !== "normals") {
      return;
    }

    const { scene } = get();
    const material = new MeshNormalMaterial();
    scene.overrideMaterial = material;
    return () => {
      scene.overrideMaterial = null;
      material.dispose();
    };
  }, [get]);

  return null;
}

// Swaps every lightmapped material for one that shows just its light map, and swaps back on cleanup.
// The scene's meshes can still be loading when this runs, so it retries until it finds some.
function showLightmaps(scene: Scene, view: "lightmap" | "lampmap") {
  const swapped: [Mesh, Material][] = [];
  const timer = window.setInterval(() => {
    scene.traverse((object) => {
      if (!(object instanceof Mesh) || swapped.some(([m]) => m === object)) {
        return;
      }
      const material = object.material as MeshStandardMaterial;
      const map: Texture | undefined =
        view === "lightmap"
          ? (material.lightMap ?? undefined)
          : material.userData.lampMap;
      if (!map) {
        return;
      }
      swapped.push([object, material]);
      object.material = new MeshBasicMaterial({ map, toneMapped: false });
    });
  }, 500);
  return () => {
    window.clearInterval(timer);
    for (const [mesh, material] of swapped) {
      (mesh.material as Material).dispose();
      mesh.material = material;
    }
  };
}

// Samples the camera path and measures how close it comes to each mesh's world bounding box. Waits until
// the workspace has loaded (some meshes present and stable for a second).
function checkPath(scene: Scene) {
  let last = -1;
  const timer = window.setInterval(() => {
    const meshes: Mesh[] = [];
    scene.traverse((o) => {
      if (o instanceof Mesh && !o.name.endsWith(HIT_TARGET_SUFFIX)) {
        meshes.push(o);
      }
    });
    if (meshes.length === 0 || meshes.length !== last) {
      last = meshes.length;
      return;
    }
    window.clearInterval(timer);
    const boxes = meshes.map((m) => ({
      name: m.name,
      box: new Box3().setFromObject(m),
    }));
    const position = new Vector3();
    const target = new Vector3();
    let closest = { distance: Infinity, name: "", t: 0 };
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      evaluateCamera(t, position, target);
      for (const { name, box } of boxes) {
        const distance = box.distanceToPoint(position);
        if (distance < closest.distance) {
          closest = { distance, name, t };
        }
      }
    }
    const result = { ...closest, meshes: boxes.length };
    (
      window as unknown as { cameraPathClearance: unknown }
    ).cameraPathClearance = result;
    console.info("camera path clearance", result);
  }, 1000);
  return () => window.clearInterval(timer);
}
