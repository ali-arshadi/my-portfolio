"use client";

// The DOM layer the monitor's content is drawn into: over the canvas, but outside its aria-hidden
// wrapper, so the content stays readable by assistive technology.
export const screenLayer: { current: HTMLDivElement | null } = {
  current: null,
};

export function ScreenLayer() {
  return (
    <div
      ref={(el) => {
        screenLayer.current = el;
      }}
      className="absolute inset-0"
    />
  );
}
