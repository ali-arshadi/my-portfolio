import type { Ref } from "react";
import { Portfolio } from "@/components/sections/Portfolio";
import { HERO, ScreenHero } from "./ScreenHero";

// The monitor's screen, in CSS pixels; the 3D screen is 16:9 as well.
export const SCREEN_PX = { width: HERO.width, height: HERO.height };

// The screen's background, the portfolio's warm black (the texture's too).
export const SCREEN_BACKGROUND = "#0d0d0b";

// Everything on the screen, top to bottom: the hero (the first view, matching the screen texture),
// then the portfolio, the same as the static page shows, laid out for the screen's 1280 px. The frame
// clips it; MonitorScreen moves it up as the page scrolls, so the reader scrolls the page, not a
// nested scroll box. It is the offset parent of its sections, for the header's links (ScreenHero).
export function ScreenContent({ ref }: { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} data-screen-content className="relative flex flex-col">
      <ScreenHero />
      <Portfolio />
    </div>
  );
}
