"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useLayoutEffect, useMemo } from "react";
import {
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Texture,
} from "three";
import {
  HIT_TARGET_SUFFIX,
  METAL_ENV_INTENSITY,
  PLAIN_ENV_INTENSITY,
} from "@/config/scene";
import {
  ASSETS,
  LAMP_EMITTERS,
  LIGHTMAP_SCALE,
} from "@/config/scene.generated";
import { lampLevel } from "./lampState";

type Asset = (typeof ASSETS)[number];

// The bake stores light without surface colour; three.js divides irradiance by pi when it applies the
// surface colour, so the stored value is scaled back up by pi.
const LIGHTMAP_INTENSITY = Math.PI * LIGHTMAP_SCALE;

function prepare(texture: Texture) {
  texture.flipY = false;
  texture.colorSpace = SRGBColorSpace;
  texture.channel = 1; // the GLBs' TEXCOORD_1, the "lightmap" UV set
  texture.needsUpdate = true;
}

// Adds the lamp's baked layer on top of the base light map, scaled by the shared lamp level. Diffuse
// light comes only from the light maps, so the live lamp spot (Lighting.tsx) is limited to its
// specular part here: the sheen the bake cannot hold, because it depends on where the camera is.
function addLampLayer(material: MeshStandardMaterial, lampMap: Texture) {
  material.userData.lampMap = lampMap; // for the ?view=lightmap debug view
  material.onBeforeCompile = (shader) => {
    shader.uniforms.lampMap = { value: lampMap };
    shader.uniforms.lampLevel = lampLevel;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D lampMap;\nuniform float lampLevel;",
      )
      .replace(
        "#include <lights_fragment_maps>",
        `#include <lights_fragment_maps>
#ifdef USE_LIGHTMAP
  irradiance += texture2D( lampMap, vLightMapUv ).rgb * lightMapIntensity * lampLevel;
#endif`,
      )
      .replace(
        "#include <lights_fragment_end>",
        "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = vec3( 0.0 );",
      );
  };
  material.customProgramCacheKey = () => "lamp-layer";
}

// The lamp's own glowing parts (bulb, diffuser) dim with the same uniform as its baked light.
function fadeWithLamp(material: MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.lampLevel = lampLevel;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float lampLevel;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= lampLevel;",
      );
  };
  material.customProgramCacheKey = () => "lamp-emitter";
  material.needsUpdate = true;
}

function isLightmapped(material: MeshStandardMaterial) {
  const emissive =
    material.emissiveIntensity > 0 &&
    material.emissive.r + material.emissive.g + material.emissive.b > 0;
  return !emissive && !material.transparent && !material.emissiveMap;
}

function AssetModel({ asset }: { asset: Asset }) {
  const { scene } = useGLTF(asset.model);
  const urls = useMemo(
    () =>
      "base" in asset.lightmaps
        ? [asset.lightmaps.base, asset.lightmaps.lamp]
        : [],
    [asset],
  );
  const maps = useTexture(urls);

  useLayoutEffect(() => {
    const [base, lamp] = maps;
    maps.forEach(prepare);
    scene.traverse((object) => {
      if (object.name.endsWith(HIT_TARGET_SUFFIX)) {
        object.visible = false;
      }
      if (!(object instanceof Mesh)) {
        return;
      }
      const material = object.material as MeshStandardMaterial;
      if ((LAMP_EMITTERS as readonly string[]).includes(material.name)) {
        fadeWithLamp(material);
      }
      material.envMapIntensity =
        material.metalness > 0.3 ? METAL_ENV_INTENSITY : PLAIN_ENV_INTENSITY;
      if (base && lamp && isLightmapped(material)) {
        material.lightMap = base;
        material.lightMapIntensity = LIGHTMAP_INTENSITY;
        addLampLayer(material, lamp);
        material.needsUpdate = true;
      }
    });
  }, [scene, maps]);

  return <primitive object={scene} />;
}

export function Workspace() {
  return (
    <>
      {ASSETS.map((asset) => (
        <AssetModel key={asset.name} asset={asset} />
      ))}
    </>
  );
}

// Start every download at once: otherwise an asset only asks for its light maps after its GLB parsed.
ASSETS.forEach((asset) => {
  useGLTF.preload(asset.model);
  if ("base" in asset.lightmaps) {
    useTexture.preload([asset.lightmaps.base, asset.lightmaps.lamp]);
  }
});
