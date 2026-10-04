import { work } from "@/data/work";
import { Section } from "./Section";

export function SelectedWork() {
  return (
    <Section title="Selected work">
      <ul className="grid gap-4">
        {work.map((item) => (
          <li key={item.title}>
            <article className="rounded-card border border-line bg-card p-6 transition-colors hover:bg-line">
              <p className="text-sm text-muted">{item.tag}</p>
              <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 max-w-prose text-muted">{item.description}</p>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
