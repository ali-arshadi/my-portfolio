import { work } from "@/data/work";
import { Section } from "./Section";

export const WORK_TITLE = "Live in production";

// The projects for the shelf's tools panel: plain cards in the site's own palette.
export function WorkList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className="grid gap-4">
      {work.map((item) => (
        <li key={item.title}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-card border border-line bg-card transition-colors hover:bg-line ${compact ? "p-4" : "p-6"}`}
          >
            <p className="text-sm text-muted">{item.years}</p>
            <h3
              className={`mt-2 font-semibold ${compact ? "text-lg" : "text-xl"}`}
            >
              {item.title}
            </h3>
            <p className="mt-2 max-w-prose text-muted">{item.description}</p>
            <p className="mt-3 text-sm text-lime">{item.site}</p>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function SelectedWork() {
  return (
    <Section name="work" title={WORK_TITLE}>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-x-12 gap-y-[72px] p-0">
        {work.map((item) => (
          <li key={item.title} className="min-w-0 @min-[760px]:even:mt-24">
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="project block"
            >
              <div className="aspect-[4/3] overflow-hidden border border-rule">
                <div className="shot label flex size-full items-center justify-center bg-[repeating-linear-gradient(135deg,#1b1b18_0_14px,#141411_14px_28px)] p-6 text-center text-[12px] text-dim">
                  {item.screenshot}
                </div>
              </div>
              <div className="mt-6 font-mono text-[13px] text-dim">
                {item.years}
              </div>
              <h3 className="mt-2 text-[clamp(32px,3.4cqw,52px)] leading-[1.02] font-bold tracking-[-0.035em]">
                {item.title}
              </h3>
              <p className="mt-4 mb-0 max-w-[460px] text-[17px] leading-normal text-pretty text-dim">
                {item.description}
              </p>
              <div className="mt-5">
                <span className="inline-block border-b border-lime pb-0.5 font-mono text-[13px] tracking-[0.02em] whitespace-pre text-lime">
                  {item.site}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
