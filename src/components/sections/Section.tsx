import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
};

export function Section({ id, title, children }: SectionProps) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-[1040px] px-6 py-20 md:px-10 md:py-28"
    >
      <h2 className="mb-10 text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
