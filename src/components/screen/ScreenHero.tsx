"use client";

import type { MouseEvent, Ref } from "react";
import { SCROLL_CUE, ScrollCue } from "@/components/hero/ScrollCue";
import { screenNav } from "@/components/scene/scrollState";
import { about } from "@/data/about";

// The monitor's first view: the portfolio design's hero and header, laid out in CSS pixels on the
// 1280 x 720 screen. The same layout is painted into the screen texture baked into the model
// (blender/scripts/shared/textures.py: screen(), at 1.25x), so the swap from texture to HTML can't be
// seen: keep the two in step. Positions are fixed, not fluid, for that reason.
export const HERO = {
  width: 1280,
  height: 720,
  padX: 64,
  columns: 12,
  location: { top: 96 },
  name: { top: 156, size: 210, lineHeight: 0.86, tracking: -0.045 },
  rule: { top: 584 },
  line: { top: 612, size: 25, lineHeight: 1.25, tracking: -0.01 },
  scroll: { center: 652.5 },
  nav: { top: 16, height: 44, shrinkTo: 860, shrinkOver: 320, glassOver: 140 },
} as const;

const INK = "#0d0d0b";

// The content's sections, in the header's order (their data-section names).
const LINKS = [
  ["Profile", "profile"],
  ["Impact", "impact"],
  ["Work", "work"],
  ["Featured", "featured"],
  ["Experience", "experience"],
  ["Stack", "stack"],
] as const;

// Scrolls the page to a section of the screen's content (or its top): the content is moved by the
// page's scroll, so a plain in-page link cannot reach it. A section stops this far short of the top,
// so its title clears the header.
const SECTION_CLEARANCE = 40;

function go(event: MouseEvent<HTMLAnchorElement>, section: string | null) {
  event.preventDefault();
  const root = event.currentTarget.closest("[data-screen]");
  const content = root?.querySelector<HTMLElement>("[data-screen-content]");
  const target = section
    ? content?.querySelector<HTMLElement>(`[data-section="${section}"]`)
    : null;
  screenNav.go(target ? target.offsetTop - SECTION_CLEARANCE : 0);
}

export function ScreenHero() {
  const { name, line, rule, scroll } = HERO;
  const [first, ...rest] = about.name.split(" ");
  return (
    <div
      className="folio relative shrink-0 overflow-hidden"
      style={{
        height: HERO.height,
        backgroundColor: INK,
        backgroundImage:
          "linear-gradient(to right, #1b1b18 1px, transparent 1px)",
        backgroundSize: `${HERO.width / HERO.columns}px 100%`,
      }}
    >
      <p
        className="label absolute m-0 text-dim"
        style={{ left: HERO.padX, top: HERO.location.top }}
      >
        {about.location}
      </p>
      <p
        aria-hidden="true"
        className="absolute m-0 font-extrabold whitespace-nowrap uppercase"
        style={{
          left: HERO.padX,
          top: name.top,
          fontSize: name.size,
          lineHeight: name.lineHeight,
          letterSpacing: `${name.tracking}em`,
        }}
      >
        <span className="block">{first}</span>
        <span className="block">{rest.join(" ")}</span>
      </p>
      <div
        className="absolute h-px bg-rule"
        style={{ left: HERO.padX, right: HERO.padX, top: rule.top }}
      />
      <p
        className="absolute m-0 whitespace-nowrap"
        style={{
          left: HERO.padX,
          top: line.top,
          fontSize: line.size,
          lineHeight: line.lineHeight,
          letterSpacing: `${line.tracking}em`,
        }}
      >
        {about.heroLine[0]}
        <br />
        {about.heroLine[1]}
      </p>
      <a
        href="#profile"
        onClick={(event) => go(event, "profile")}
        className="absolute flex size-11 items-center justify-center"
        style={{
          // the cue's right edge on the content's, centred on scroll.center, in a 44 px target
          right: HERO.padX - (44 - SCROLL_CUE.width) / 2,
          top: scroll.center - 22,
        }}
      >
        <ScrollCue label="Scroll to my profile" />
      </a>
    </div>
  );
}

// The header over the screen: on the first view clear, as painted into the texture; as the content
// scrolls it narrows and turns to frosted glass, as the design's does. MonitorScreen sets --p (the
// narrowing) and --q (the glass) from the content's scroll.
export function ScreenNav({ ref }: { ref?: Ref<HTMLElement> }) {
  const { nav } = HERO;
  const full = HERO.width - 2 * HERO.padX;
  return (
    <nav
      ref={ref}
      aria-label="Portfolio"
      className="screen-nav absolute left-1/2 flex -translate-x-1/2 items-center justify-between gap-x-6 rounded-full border font-mono"
      style={{
        top: nav.top,
        width: `calc(${full}px - ${full - nav.shrinkTo}px * var(--p, 0))`,
      }}
    >
      <a
        href="#top"
        aria-label="Back to top"
        onClick={(event) => go(event, null)}
        className="flex size-11 flex-none items-center justify-center rounded-full bg-accent text-[14px] font-medium tracking-[-0.02em] text-ink"
      >
        AA
      </a>
      <div className="flex flex-1 items-center justify-center gap-x-[25.6px]">
        {LINKS.map(([label, section]) => (
          <a
            key={section}
            href={`#${section}`}
            onClick={(event) => go(event, section)}
            className="label flex min-h-11 items-center text-paper opacity-70 transition-opacity hover:opacity-100"
          >
            {label}
          </a>
        ))}
      </div>
      <a
        href="#contact"
        onClick={(event) => go(event, "contact")}
        className="lift label flex min-h-11 flex-none items-center rounded-full bg-accent px-6 font-medium text-ink"
      >
        Contact
      </a>
    </nav>
  );
}
