import { about } from "@/data/about";

// What sits over the opening frame: only the scroll hint. ScrollController fades it out
// (#hero-overlay) as the camera starts to move. #hero lets clicks through to the monitor, so the skip
// link takes them back. The scroll hint depends on the scene mode; globals.css shows the right one.
// The name and the tagline are on the monitor's screen in the opening frame (the live scene and the
// still alike), so the page's title is for screen readers only and the tagline is left to the screen.
export function StaticHero() {
  return (
    <>
      <a
        href="#content"
        className="pointer-events-auto absolute left-4 top-4 z-20 -translate-y-[200%] rounded-card bg-card px-3 py-2 text-sm text-fg focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <div
        id="hero-overlay"
        className="pointer-events-none relative z-10 w-full px-[clamp(1.25rem,5vw,4rem)] pb-[9vh] pt-24 will-change-[opacity,transform]"
      >
        <h1 className="sr-only">{about.name}</h1>
        <p className="text-[0.95rem] text-lime">
          <span className="hint-3d">Scroll to step up to the screen</span>
          <span className="hint-static">Scroll for my work</span>
        </p>
      </div>
    </>
  );
}
