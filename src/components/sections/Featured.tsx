import { featured } from "@/data/work";

const SUBTITLE =
  "mb-8 text-[clamp(28px,3.4cqw,52px)] leading-[1.02] font-bold tracking-[-0.035em]";

// The featured product: its request-to-payment flow, then the migration it is crossing.
export function Featured() {
  const last = featured.flow.length - 1;
  return (
    <section
      data-section="featured"
      aria-label={featured.name.join(" ")}
      className="px-[clamp(20px,5cqw,72px)] pb-[88px]"
    >
      <div className="border-t border-rule pt-[72px]">
        <h2 className="m-0 text-[clamp(64px,12cqw,200px)] leading-[0.86] font-extrabold tracking-[-0.05em] uppercase">
          {featured.name[0]} <br />
          {featured.name[1]}
        </h2>
        <p className="mt-10 mb-0 max-w-[760px] text-[clamp(20px,2cqw,26px)] leading-[1.3] tracking-[-0.01em] text-pretty">
          {featured.lead}
        </p>

        <h3 className={`mt-24 ${SUBTITLE}`}>{featured.flowTitle}</h3>
        <ol className="m-0 flex list-none flex-wrap gap-4 p-0">
          {featured.flow.map((step, i) => {
            const end = i === last;
            return (
              <li
                key={step}
                className={`tile flex min-h-[240px] min-w-0 flex-[1_1_190px] flex-col justify-between gap-8 border border-rule p-6 ${end ? "bg-lime text-ink" : "bg-tile"}`}
              >
                <div
                  className={`font-mono text-[13px] ${end ? "" : "text-dim"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="text-[clamp(26px,2.4cqw,36px)] leading-[1.05] font-bold tracking-[-0.03em]">
                    {step}
                  </div>
                  <div className={`mt-6 h-1 ${end ? "bg-ink/20" : "bg-rule"}`}>
                    <div
                      className={`h-1 ${end ? "bg-ink" : "bg-lime"}`}
                      style={{
                        width: `${((i + 1) * 100) / featured.flow.length}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <h3 className={`mt-28 ${SUBTITLE}`}>{featured.migrationTitle}</h3>
        <div className="border border-rule bg-[#10100e]">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule px-8 py-5">
            <span className="label text-dim">{featured.migrationFrom}</span>
            <span className="label flex min-h-8 items-center rounded-full bg-lime px-4 text-[12px] font-medium text-ink">
              {featured.migrationVia}
            </span>
            <span className="label">{featured.migrationTo}</span>
          </div>
          <ul className="m-0 list-none p-0">
            {featured.migration.map((row) => (
              <li
                key={row.from}
                className="migration-row flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-[#1e1e1b] px-8 py-[30px]"
              >
                <span className="min-w-0 flex-[1_1_220px] text-[clamp(22px,2.4cqw,34px)] tracking-[-0.02em] text-[#8c8a82] line-through decoration-faint">
                  {row.from}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden flex-[0_0_140px] items-center @min-[760px]:flex"
                >
                  <span className="size-2 rounded-full bg-faint" />
                  <span className="h-px flex-1 bg-faint" />
                  <span className="size-2 rounded-full bg-lime" />
                </span>
                <span className="min-w-0 flex-[1_1_260px] text-[clamp(22px,2.4cqw,34px)] font-semibold tracking-[-0.02em]">
                  <span className="sr-only">becomes </span>
                  {row.to}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-7 mb-0 max-w-[640px] text-base leading-normal text-pretty text-dim">
          {featured.migrationNote}
        </p>
      </div>
    </section>
  );
}
