// Which shelf panel is open, if any. The scene (ShelfObjects) and the keyboard buttons open one;
// ShelfPanel shows it and closes it. A plain store, so the scene can read it every frame.
// It holds the book it was opened from (null from the keyboard button), whose tool the panel marks.
export type ShelfPanelId = { book: number | null };

let current: ShelfPanelId | null = null;
const listeners = new Set<() => void>();

function set(next: ShelfPanelId | null) {
  current = next;
  listeners.forEach((listener) => listener());
}

export const shelfPanel = {
  get: () => current,
  open: (panel: ShelfPanelId) => set(panel),
  close: () => set(null),
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
