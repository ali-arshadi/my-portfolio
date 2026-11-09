import { impact } from "@/data/impact";
import { Section } from "./Section";

const BIG =
  "text-[clamp(64px,8.6cqw,148px)] leading-[0.86] font-extrabold tracking-[-0.06em]";

export function Impact() {
  const { buildTime, bundle, stats } = impact;
  return (
    <Section name="impact" title="Receipts, not claims">
      <div className="grid grid-cols-12 gap-4">
        <div className="tile col-span-12 flex min-h-[420px] min-w-0 flex-col justify-between gap-10 bg-accent p-9 text-ink @min-[980px]:col-span-7">
          <div className="label">{buildTime.label}</div>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-5">
              <span className={BIG}>{buildTime.value}</span>
              <span className="text-[clamp(24px,2.6cqw,40px)] font-semibold tracking-[-0.03em]">
                {buildTime.unit}
              </span>
            </div>
            <div className="mt-7 flex max-w-[560px] flex-col gap-2.5 font-mono text-[13px]">
              <div className="flex h-9 items-center bg-ink/15 px-3.5">
                {buildTime.before}
              </div>
              <div className="flex h-9 w-[44%] min-w-[120px] items-center bg-ink px-3.5 text-accent">
                {buildTime.after}
              </div>
            </div>
          </div>
        </div>
        <div className="tile col-span-12 flex min-h-[420px] min-w-0 flex-col justify-between gap-10 border border-rule bg-tile p-9 @min-[980px]:col-span-5">
          <div className="label text-dim">{bundle.label}</div>
          <div>
            <div className={`${BIG} text-accent`}>{bundle.value}</div>
            <p className="mt-6 mb-0 max-w-[320px] text-lg leading-[1.4] text-dim">
              {bundle.text}
            </p>
          </div>
        </div>
        {stats.map((stat) => (
          <div
            key={stat.value}
            className="tile col-span-12 flex min-h-[300px] min-w-0 flex-col justify-between gap-8 border border-rule bg-tile p-8 @min-[980px]:col-span-4"
          >
            <div className={BIG}>{stat.value}</div>
            <p className="m-0 text-[17px] leading-[1.4] text-dim">
              {stat.text}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
