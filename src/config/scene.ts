// Invisible meshes that only exist as click targets (see docs/asset-inventory.md).
export const HIT_TARGET_SUFFIX = "_hit";

// Diffuse light comes from the baked light maps. The environment only adds reflections: full strength
// on metals, which have no diffuse colour to show the bake on, and a trace on everything else.
export const METAL_ENV_INTENSITY = 1;
export const PLAIN_ENV_INTENSITY = 0.08;

// Bloom on light sources only: the threshold sits above anything the bake lights (the brightest lit
// surface is well under 1 before exposure), so only emissive parts glow. A small radius keeps the glow
// close to them; a wide one hazes the dark walls next to the LED and lamp.
export const BLOOM = {
  threshold: 1.5,
  smoothing: 0.2,
  intensity: 0.3,
  radius: 0.4,
};
