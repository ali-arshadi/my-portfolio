// Which shelf panel is open, if any. The scene (ShelfObjects) and the keyboard buttons open one;
// ShelfPanel shows it and closes it. A plain store, so the scene can read it every frame.
//   tools  a book: the tools list with that book's tool marked, and the selected work
//   about  the figurine
export type ShelfPanelId =
  { kind: "tools"; book: number | null } | { kind: "about" };

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
