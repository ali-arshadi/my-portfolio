import type { ReactNode } from "react";

type SectionProps = {
  // the section's name, for the monitor header's links (ScreenNav)
  name: string;
  title: string;
  children: ReactNode;
};

// One section of the portfolio content: a rule, a big uppercase title, then the content. Sizes are in
// container units of the .folio wrapper (Portfolio), so the monitor's 1280 px screen and a phone both
// get a layout that fits them.
export function Section({ name, title, children }: SectionProps) {
  return (
    <section
      data-section={name}
      className="px-[clamp(20px,5cqw,72px)] pb-[88px]"
    >
      <div className="border-t border-rule pt-12">
        <h2 className="mb-12 text-[clamp(40px,5.5cqw,88px)] leading-[0.92] font-extrabold tracking-[-0.045em] text-balance uppercase">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
