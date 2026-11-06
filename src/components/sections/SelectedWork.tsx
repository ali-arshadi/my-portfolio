import { work } from "@/data/work";
import { Section } from "./Section";

export const WORK_TITLE = "Selected work";

export function WorkList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className="grid gap-4">
      {work.map((item) => (
        <li key={item.title}>
          <article
            className={`rounded-card border border-line bg-card transition-colors hover:bg-line ${compact ? "p-4" : "p-6"}`}
          >
            <p className="text-sm text-muted">{item.tag}</p>
            <h3
              className={`mt-2 font-semibold ${compact ? "text-lg" : "text-xl"}`}
            >
              {item.title}
            </h3>
            <p className="mt-3 max-w-prose text-muted">{item.description}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function SelectedWork() {
  return (
    <Section title={WORK_TITLE}>
      <WorkList />
    </Section>
  );
}
