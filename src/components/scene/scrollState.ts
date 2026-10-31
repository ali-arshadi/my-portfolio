// Scroll progress through the hero, 0 (opening frame) to 1 (focused on the screen). ScrollController
// writes it; CameraRig reads it every frame. A plain object, so scrolling causes no React updates.
export const scroll = { t: 0 };
