import { about } from "@/data/about";

function Band({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center"
    >
      {about.practices.map((word) => (
        <span
          key={word}
          className="flex items-center gap-8 pr-8 text-[clamp(32px,4.2cqw,60px)] font-bold tracking-[-0.03em] whitespace-nowrap uppercase"
        >
          <span>{word}</span>
          <span
            aria-hidden="true"
            className="block size-3.5 rotate-45 bg-ink"
          />
        </span>
      ))}
    </div>
  );
}

// The amber band of what the work is about, running sideways (still with reduced motion).
export function Practices() {
  return (
    <section
      aria-label="Practices"
      className="overflow-hidden bg-accent py-[22px] text-ink"
    >
      <div className="folio-marquee">
        <Band />
        <Band hidden />
      </div>
    </section>
  );
}
