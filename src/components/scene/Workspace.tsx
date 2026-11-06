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
import { motionScale, sceneTime } from "./motionState";

type Asset = (typeof ASSETS)[number];
type Shader = Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];

// How far a plant's leaf tips sway, in metres: the pothos's long vines move more than the stiff
// snake-plant blades.
const SWAY: Partial<Record<Asset["name"], number>> = {
  shelf_plant: 0.008,
  floor_plant: 0.004,
};

// Adds a shader patch to a material, after any it already has: the plants' leaves take both the
// lamp-layer patch and the sway, so patches chain instead of replacing each other. A patch is applied
// once per material (the effect that applies them can run again, e.g. in development).
function patch(
  material: MeshStandardMaterial,
  key: string,
  apply: (shader: Shader) => void,
) {
  const keys: string[] = (material.userData.patches ??= []);
  if (keys.includes(key)) {
    return;
  }
  const previous = material.onBeforeCompile;
  keys.push(key);
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    apply(shader);
  };
  material.customProgramCacheKey = () => keys.join("|");
  material.needsUpdate = true;
}

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
//
// The bake holds diffuse light only. Most surfaces here are near-black, and what Blender shows on them
// is mostly their rough reflection (a few percent of the light, several times their diffuse), so
// without it walls and the poster crush to black. Dielectrics get that reflection back from the baked
// light, weighted by three's own split-sum term. The lamp layer counts only on the roughest surfaces
// (the walls): on glossier ones the live spot already draws the lamp's reflection.
function addLampLayer(material: MeshStandardMaterial, lampMap: Texture) {
  material.userData.lampMap = lampMap; // for the ?view=lightmap debug view
  patch(material, "lamp-layer", (shader) => {
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
        `#include <lights_fragment_end>
  reflectedLight.directDiffuse = vec3( 0.0 );
#ifdef USE_LIGHTMAP
  reflectedLight.indirectSpecular += ( texture2D( lightMap, vLightMapUv ).rgb
      + texture2D( lampMap, vLightMapUv ).rgb * lampLevel * smoothstep( 0.85, 0.95, material.roughness ) )
    * lightMapIntensity * RECIPROCAL_PI
    * EnvironmentBRDF( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness )
    * ( 1.0 - metalnessFactor );
#endif`,
      );
  });
}

// The lamp's own glowing parts (bulb, diffuser) dim with the same uniform as its baked light.
function fadeWithLamp(material: MeshStandardMaterial) {
  patch(material, "lamp-emitter", (shader) => {
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
  });
}

// Plant sway: each vertex moves sideways by its _sway weight (0 at the pot, 1 at the tips, exported by
// blender/scripts/shared/foliage.py), along two or three incommensurate sines of time and position, so
// the motion never visibly loops and costs nothing on the CPU. The offset is in world metres, turned
// into the mesh's own space: the compressed models carry a scale on each node.
function addSway(material: MeshStandardMaterial, amount: number) {
  patch(material, `sway-${amount}`, (shader) => {
    shader.uniforms.sceneTime = sceneTime;
    shader.uniforms.motionScale = motionScale;
    shader.uniforms.swayAmount = { value: amount };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float _sway;
uniform float sceneTime;
uniform float motionScale;
uniform float swayAmount;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  vec3 wp = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
  float t = sceneTime;
  vec3 drift = vec3(
    sin( t * 0.9 + wp.y * 3.1 + wp.x * 1.7 ) + 0.45 * sin( t * 2.3 + wp.z * 5.3 ),
    0.0,
    sin( t * 0.7 + wp.y * 2.3 + wp.z * 1.9 ) + 0.35 * sin( t * 1.9 + wp.x * 4.1 )
  );
  transformed += inverse( mat3( modelMatrix ) ) * ( drift * _sway * swayAmount * motionScale );
}`,
      );
  });
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
      }
      const sway = SWAY[asset.name];
      if (sway && object.geometry.getAttribute("_sway")) {
        addSway(material, sway);
      }
    });
  }, [scene, maps, asset.name]);

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
