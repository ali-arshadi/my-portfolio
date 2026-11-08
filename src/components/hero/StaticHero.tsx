import { about } from "@/data/about";
import { ScrollCue } from "./ScrollCue";

// What sits over the opening frame: only the scroll cue. ScrollController fades it out
// (#hero-overlay) as the camera starts to move. #hero lets clicks through to the monitor, so the skip
// link takes them back. The scroll hint depends on the scene mode; globals.css shows the right one.
// The name and the tagline are on the monitor's screen in the opening frame (the live scene and the
// still alike), so the page's title is for screen readers only and the tagline is left to the screen.
//
// Next to the scroll cue, in 3D mode only, a hint that the scene's objects can be clicked: nothing
// else tells the reader until they happen to hover one. It goes once they click one (ScenePointer sets
// <html data-scene-touched>). It is hidden from screen readers: the objects take only the mouse, and
// keyboard users get buttons for them instead (ShelfPanel).
function SceneHint() {
  return (
    <span
      aria-hidden="true"
      className="scene-hint label hint-3d items-center gap-2 text-dim"
    >
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      >
        <path d="M3.5 2.5l9 4.2-4 1.3-1.6 4.2z" />
      </svg>
      Click the lamp, the books or the cat
    </span>
  );
}

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
        <div className="flex items-center gap-6">
          <span className="text-lamp">
            <span className="hint-3d">
              <ScrollCue label="Scroll to step up to the screen" />
            </span>
            <span className="hint-static">
              <ScrollCue label="Scroll for my work" />
            </span>
          </span>
          <SceneHint />
        </div>
      </div>
    </>
  );
}
