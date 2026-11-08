import { stack, type Tool, tools } from "@/data/tools";
import { Section } from "./Section";

export const TOOLS_TITLE = "Daily drivers";

// Every tool in one row of chips, for the shelf's tools panel. `marked` picks out the book's tool.
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
    <Section id="stack" title={TOOLS_TITLE}>
      <dl className="m-0 flex flex-col border-t border-rule">
        {stack.map((group) => (
          <div
            key={group.label}
            className="stack-row flex flex-wrap gap-x-12 gap-y-3 border-b border-rule py-8"
          >
            <dt className="label flex-[0_0_200px] pt-3 text-dim">
              {group.label}
            </dt>
            <dd className="m-0 flex min-w-0 flex-[1_1_300px] flex-wrap gap-x-7 gap-y-1 text-[clamp(30px,3.8cqw,58px)] leading-[1.1] font-semibold tracking-[-0.03em]">
              {group.items.map((item) => (
                <span key={item} className="stack-item">
                  {item}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
