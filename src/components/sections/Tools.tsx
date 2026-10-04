import { tools } from "@/data/tools";
import { Section } from "./Section";

export function Tools() {
  return (
    <Section title="Tools I use">
      <ul className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <li
            key={tool}
            className="rounded-card border border-line bg-card px-3 py-1.5 text-sm"
          >
            {tool}
          </li>
        ))}
      </ul>
    </Section>
  );
}
