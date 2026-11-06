import { experience } from "@/data/experience";
import { Section } from "./Section";

export const EXPERIENCE_TITLE = "Where I've worked";

export function ExperienceList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-3" : "space-y-6"}>
      {experience.map((job) => (
        <li
          key={job.company}
          className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"
        >
          <span className="font-semibold">{job.company}</span>
          <time
            dateTime={job.end ? `${job.start}/${job.end}` : job.start}
            className="text-muted"
          >
            {job.dates}
          </time>
        </li>
      ))}
    </ul>
  );
}

export function Experience() {
  return (
    <Section title={EXPERIENCE_TITLE}>
      <ExperienceList />
    </Section>
  );
}
