export function StaticHero() {
  return (
    <>
      <a
        href="#content"
        className="absolute left-4 top-4 z-20 -translate-y-[200%] rounded-card bg-card px-3 py-2 text-sm text-fg focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <div className="relative z-10 mx-auto w-full max-w-[1040px] px-6 pb-16 pt-24 md:px-10 md:pb-24">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl">
          Ali Arshadi
        </h1>
        <p className="mt-4 text-lg text-muted sm:text-xl">
          Front-end developer
        </p>
        <p className="mt-8 text-lamp">Scroll to step up to the screen</p>
      </div>
    </>
  );
}
