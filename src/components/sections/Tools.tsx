import { stack } from "@/data/tools";
import { Section } from "./Section";

export const TOOLS_TITLE = "Daily drivers";

export function Tools() {
  return (
    <Section name="stack" title={TOOLS_TITLE}>
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
