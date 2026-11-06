// How brightly the desk lamp shines, 0 (off) to 1 (on). One uniform object is shared by every
// lightmapped material, so changing `value` fades the baked lamp light everywhere at once.
// It starts off: LampSwitch turns the lamp on once the loader has revealed the scene.
export const lampLevel = { value: 0 };
