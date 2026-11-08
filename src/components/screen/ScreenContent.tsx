import type { Ref } from "react";
import { Portfolio } from "@/components/sections/Portfolio";

// The monitor's screen, in CSS pixels; the 3D screen is 16:9 as well.
export const SCREEN_PX = { width: 1280, height: 720 };

// The first view repeats the screen image baked into the model (blender/scripts/shared/textures.py:
// screen()), so the swap from texture to HTML can't be seen. Layout is in fractions of the screen,
// as there; colours are the texture's as displayed after tone mapping.
const CODE_LINES = [
  [0, 0.11],
  [0.01, 0.17],
  [0.03, 0.14],
  [0.04, 0.24],
  [0, 0.15],
  [0.01, 0.19],
  [0.03, 0.13],
  [0.04, 0.18],
  [0, 0.21],
  [0.01, 0.13],
  [0.03, 0.17],
  [0.04, 0.15],
  [0.01, 0.12],
  [0, 0.19],
  [0.03, 0.17],
  [0.04, 0.22],
] as const;
const CODE_COLORS = ["#7aa2ff", "#be96ff", "#ffb454", "#5a647d", "#8fd3a8"];
const DOTS = ["#ff5f57", "#febc2e", "#28c840"];

const { width: W, height: H } = SCREEN_PX;

function Intro() {
  return (
    <div className="relative shrink-0" style={{ height: H }}>
      {CODE_LINES.map(([indent, length], i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute rounded-[3px]"
          style={{
            left: (0.04 + indent) * W,
            top: 0.12 * H + i * 0.046 * H,
            width: length * 1.3 * W,
            height: (16 / 900) * H,
            background: CODE_COLORS[i % CODE_COLORS.length],
            opacity: 0.85,
          }}
        />
      ))}
      <div className="absolute" style={{ left: 0.57 * W, top: 0.395 * H }}>
        <p
          className="font-bold leading-none tracking-[-0.01em]"
          style={{ fontSize: (96 / 1600) * W, color: "#f0f0ec" }}
        >
          Ali Arshadi
        </p>
        <p
          className="mt-3 leading-none"
          style={{ fontSize: (40 / 1600) * W, color: "#8c96af" }}
        >
          Front-end developer
        </p>
      </div>
      <p
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted"
      >
        Keep scrolling
      </p>
    </div>
  );
}

// Everything on the screen, top to bottom. The frame clips it; MonitorScreen moves it up as the page
// scrolls, so the reader scrolls the page, not a nested scroll box. After the first view comes the
// portfolio, the same as the static page shows, laid out for the screen's 1280 px.
export function ScreenContent({ ref }: { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="flex flex-col text-fg">
      <Intro />
      <Portfolio />
    </div>
  );
}

// How far the content has scrolled when the portfolio's warm black reaches the title bar, and how
// much further until the bar has taken that colour over from the intro's navy (MonitorScreen).
export const TITLE_BAR_SWAP = { from: 0.87 * H, length: 120 };

// The screen's background: navy, darker at the top, with the soft glow behind the name.
export const SCREEN_BACKGROUND =
  "radial-gradient(ellipse 45% 60% at 70% 42%, rgba(0, 32, 92, 0.6), transparent 70%), linear-gradient(180deg, #00061a 0%, #000e2e 85%)";

// The window's title bar: the three dots over a strip of the screen's top colour that the content
// fades out under as it scrolls (on the first view it matches the background, so it can't be seen).
// Over the portfolio the strip turns its warm black: `inkRef` is that layer, faded in by MonitorScreen.
export function WindowDots({ inkRef }: { inkRef?: Ref<HTMLDivElement> }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{
        height: 0.13 * H,
        background: "linear-gradient(180deg, #00061a 60%, rgba(0, 6, 26, 0))",
      }}
    >
      <div
        ref={inkRef}
        className="absolute inset-0"
        style={{
          opacity: 0,
          background:
            "linear-gradient(180deg, #0d0d0b 60%, rgba(13, 13, 11, 0))",
        }}
      />
      <div
        className="absolute flex"
        style={{ left: 0.035 * W - 9 * (W / 1600), top: (46 / 900) * H }}
      >
        {DOTS.map((c) => (
          <span
            key={c}
            className="rounded-full"
            style={{
              width: (18 / 1600) * W,
              height: (18 / 1600) * W,
              marginRight: (16 / 1600) * W,
              background: c,
            }}
          />
        ))}
      </div>
    </div>
  );
}
