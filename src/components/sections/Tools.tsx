import { type Tool, tools } from "@/data/tools";
import { Section } from "./Section";

export const TOOLS_TITLE = "Tools I use";

// `marked` picks out one tool: the shelf book the reader opened the panel from (ShelfPanel).
export function ToolList({ marked = null }: { marked?: Tool | null }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tools.map((tool) => (
        <li
          key={tool}
          aria-current={tool === marked ? "true" : undefined}
          className={`rounded-card border bg-card px-3 py-1.5 text-sm ${tool === marked ? "border-lamp text-lamp" : "border-line"}`}
        >
          {tool}
        </li>
      ))}
    </ul>
  );
}

export function Tools() {
  return (
    <Section title={TOOLS_TITLE}>
      <ToolList />
    </Section>
  );
}
