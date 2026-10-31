// The hero text over the opening frame. ScrollController fades it out (#hero-overlay) as the camera
// starts to move.
export function StaticHero() {
  return (
    <>
      <a
        href="#content"
        className="absolute left-4 top-4 z-20 -translate-y-[200%] rounded-card bg-card px-3 py-2 text-sm text-fg focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <div
        id="hero-overlay"
        className="pointer-events-none relative z-10 w-full px-[clamp(1.25rem,5vw,4rem)] pb-[9vh] pt-24 will-change-[opacity,transform]"
      >
        <h1 className="text-[clamp(3rem,11vw,9rem)] font-bold leading-[0.92] tracking-[-0.03em]">
          Ali Arshadi
        </h1>
        <p className="mt-4 text-[clamp(1rem,2vw,1.35rem)] text-muted">
          Front-end developer. Vue, Nuxt, React, TypeScript.
        </p>
        <p className="mt-8 text-[0.95rem] text-lamp">
          Scroll to step up to the screen
        </p>
      </div>
    </>
  );
}
