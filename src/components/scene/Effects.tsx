"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, Effect } from "postprocessing";
import { useMemo } from "react";
import { BLOOM } from "@/config/scene";

// AgX tone mapping (with the renderer's exposure), except on the monitor's screen: its pixels carry
// alpha 0 in the scene render (Workspace.tsx: asDisplay) and keep their colour, so the screen shows its
// texture exactly, as the live HTML that replaces it does. The mark is read from the scene render
// itself (inputBuffer), as bloom has added to the alpha by this point; anti-aliased edges blend.
const fragment = /* glsl */ `
#include <tonemapping_pars_fragment>
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float display = 1.0 - texture2D(inputBuffer, uv).a;
  outputColor = vec4(mix(AgXToneMapping(inputColor.rgb), clamp(inputColor.rgb, 0.0, 1.0), display), 1.0);
}`;

class SceneToneMapping extends Effect {
  constructor() {
    super("SceneToneMapping", fragment, { blendFunction: BlendFunction.SRC });
  }
}

// The scene renders in linear HDR into the composer; bloom picks out the light sources, then tone
// mapping produces the final image, as in the Blender preview.
export function Effects() {
  const toneMapping = useMemo(() => new SceneToneMapping(), []);
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        mipmapBlur
        luminanceThreshold={BLOOM.threshold}
        luminanceSmoothing={BLOOM.smoothing}
        intensity={BLOOM.intensity}
        radius={BLOOM.radius}
      />
      <primitive object={toneMapping} />
    </EffectComposer>
  );
}
