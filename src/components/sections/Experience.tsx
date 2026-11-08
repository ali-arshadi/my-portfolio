import { experience, type ExperienceItem } from "@/data/experience";
import { Section } from "./Section";

export const EXPERIENCE_TITLE = "Where I’ve shipped";

function dateTime(job: ExperienceItem) {
  if (!job.start) {
    return undefined;
  }
  return job.end ? `${job.start}/${job.end}` : job.start;
}

// Companies and dates only, for the shelf's About panel.
export function ExperienceList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-3" : "space-y-6"}>
      {experience.map((job) => (
        <li
          key={job.company}
          className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"
        >
          <span className="font-semibold">{job.company}</span>
          <time dateTime={dateTime(job)} className="text-muted">
            {job.dates}
          </time>
        </li>
      ))}
    </ul>
  );
}

// Every job open: on the monitor an accordion would change the content's height, and with it the
// length of the page's scroll, under the reader.
export function Experience() {
  return (
    <Section name="experience" title={EXPERIENCE_TITLE}>
      <ul className="m-0 list-none border-b border-rule p-0">
        {experience.map((job) => (
          <li key={job.company} className="border-t border-rule py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
              <div className="min-w-0 flex-[1_1_260px]">
                <h3 className="m-0 text-[clamp(32px,4.4cqw,68px)] leading-none font-bold tracking-[-0.035em]">
                  {job.company}
                </h3>
                <p className="mt-3 mb-0 font-mono text-[13px] leading-normal tracking-[0.02em] text-dim">
                  {job.sub}
                </p>
              </div>
              <time
                dateTime={dateTime(job)}
                className="font-mono text-[13px] whitespace-nowrap text-dim"
              >
                {job.dates}
              </time>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-16 gap-y-6 border border-rule bg-tile p-8">
              {job.tags.length > 0 && (
                <ul className="m-0 flex min-w-0 flex-[1_1_200px] list-none flex-wrap content-start gap-2 p-0">
                  {job.tags.map((tag) => (
                    <li
                      key={tag}
                      className="flex min-h-8 items-center rounded-full border border-faint px-3.5 font-mono text-[12px]"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              <ul className="m-0 flex min-w-0 flex-[3_1_380px] list-none flex-col gap-4 p-0">
                {job.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-3.5 text-base leading-normal text-pretty"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-2 flex-none bg-lime"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
