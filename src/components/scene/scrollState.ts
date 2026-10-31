// Scroll progress through the hero. ScrollController writes it; CameraRig and MonitorScreen read it
// every frame. Plain objects, so scrolling causes no React updates.
//   t        camera path, 0 (opening frame) to 1 (square on to the screen)
//   content  the monitor's content, 0 (its first view) to 1 (scrolled to the end)
export const scroll = { t: 0, content: 0 };

// How far the monitor's content scrolls, in its own CSS pixels (its height minus the screen's). The
// scroll timeline is as long as the camera move plus this, so it is rebuilt when it changes.
let distance = 0;
const listeners = new Set<() => void>();

export const screenScroll = {
  get: () => distance,
  set(value: number) {
    const next = Math.max(0, Math.round(value));
    if (next !== distance) {
      distance = next;
      listeners.forEach((listener) => listener());
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
