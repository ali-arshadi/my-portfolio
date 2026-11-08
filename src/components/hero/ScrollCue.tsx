// A scroll cue drawn rather than written: a mouse outline whose wheel dot slides down and fades, on a
// loop (still with reduced motion; globals.css, .scroll-cue). It takes the text colour. The label is
// for screen readers only. On the monitor's hero it is also painted into the screen texture, at rest:
// blender/scripts/shared/textures.py draws SCROLL_CUE, so keep the sizes in step.
export const SCROLL_CUE = {
  width: 26,
  height: 40,
  border: 2,
  dot: { width: 4, height: 8, top: 8 },
} as const;

export function ScrollCue({ label }: { label: string }) {
  const { width, height, border, dot } = SCROLL_CUE;
  return (
    <span className="scroll-cue inline-flex">
      <span
        aria-hidden="true"
        className="relative block rounded-full border-current"
        style={{ width, height, borderWidth: border, borderStyle: "solid" }}
      >
        <span
          className="scroll-cue-dot absolute left-1/2 block rounded-full bg-current"
          style={{
            width: dot.width,
            height: dot.height,
            top: dot.top - border,
            marginLeft: -dot.width / 2,
          }}
        />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
