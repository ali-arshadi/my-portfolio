// Shared uniforms for the scene's small motions. SceneMotion updates them every frame.
//   sceneTime    seconds since the scene started
//   motionScale  1, or 0 when the reader prefers reduced motion (plants hold still, the candle steadies)
export const sceneTime = { value: 0 };
export const motionScale = { value: 1 };
