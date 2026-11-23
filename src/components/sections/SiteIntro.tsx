"use client";

import type { MouseEvent } from "react";
import { SCROLL_CUE, ScrollCue } from "@/components/hero/ScrollCue";
import { NAV_LINKS } from "@/components/screen/nav";
import { about } from "@/data/about";

const CLEARANCE = 72;

function go(event: MouseEvent<HTMLAnchorElement>, section: string | null) {
  event.preventDefault();
  const target = section
    ? document.querySelector<HTMLElement>(`#content [data-section="${section}"]`)
    : document.getElementById("content");
  const top = target
    ? target.getBoundingClientRect().top + window.scrollY - CLEARANCE
    : 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 h-0">
      <nav
        aria-label="Portfolio"
        className="site-nav screen-nav relative top-3 mx-auto flex w-[min(92vw,52rem)] items-center justify-between gap-x-3 rounded-full border font-mono"
      >
        <a
          href="#content"
          aria-label="Back to top"
          onClick={(event) => go(event, null)}
          className="flex size-11 flex-none items-center justify-center rounded-full bg-accent text-[14px] font-medium tracking-[-0.02em] text-ink"
        >
          AA
        </a>
        <div className="flex min-w-0 flex-1 items-center justify-start gap-x-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden @min-[720px]:justify-center @min-[720px]:gap-x-6">
          {NAV_LINKS.map(([label, section]) => (
            <a
              key={section}
              href={`#${section}`}
              onClick={(event) => go(event, section)}
              className="label flex min-h-11 shrink-0 items-center text-paper opacity-70 transition-opacity hover:opacity-100"
            >
              {label}
            </a>
          ))}
        </div>
        <a
          href="#contact"
          onClick={(event) => go(event, "contact")}
          className="lift label flex min-h-11 flex-none items-center rounded-full bg-accent px-4 font-medium text-ink @min-[720px]:px-6"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}

// The monitor's first view, as a fluid page: phones and tablets have no scene, so the name, the
// header and the tagline have to live here. Positions follow the screen hero, but size with the
// container rather than the 1280 x 720 frame.
export function SiteIntro() {
  const [first, ...rest] = about.name.split(" ");
  return (
    <div className="folio relative">
      <SiteHeader />
      <section
        className="relative flex min-h-dvh flex-col justify-between px-[clamp(20px,5cqw,72px)] pt-28 pb-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1b1b18 1px, transparent 1px)",
          backgroundSize: "calc(100% / 12) 100%",
        }}
      >
        <p className="label m-0 text-dim">{about.location}</p>
        <h1 className="m-0 font-extrabold uppercase tracking-[-0.045em] leading-[0.86] text-[clamp(3.25rem,16cqi,13.125rem)]">
          <span className="block">{first}</span>
          <span className="block">{rest.join(" ")}</span>
        </h1>
        <div>
          <div className="h-px bg-rule" />
          <div className="mt-6 flex items-end justify-between gap-6">
            <p className="m-0 max-w-[28em] text-[clamp(16px,2.2cqi,25px)] leading-[1.25] tracking-[-0.01em]">
              {about.heroLine[0]}
              <br />
              {about.heroLine[1]}
            </p>
            <a
              href="#profile"
              onClick={(event) => go(event, "profile")}
              className="flex size-11 flex-none items-center justify-center"
              style={{
                marginRight: -(44 - SCROLL_CUE.width) / 2,
              }}
            >
              <ScrollCue label="Scroll to my profile" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
