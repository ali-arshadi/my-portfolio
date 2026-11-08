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

// Scrolls the page to a point in the monitor's content (in its CSS pixels from the top), for the
// monitor's header links. ScrollController registers how: the content does not scroll itself, the
// page does, after the camera move.
let toScreen: ((y: number) => void) | null = null;

export const screenNav = {
  go: (y: number) => toScreen?.(y),
  register(fn: (y: number) => void) {
    toScreen = fn;
    return () => {
      if (toScreen === fn) {
        toScreen = null;
      }
    };
  },
};
