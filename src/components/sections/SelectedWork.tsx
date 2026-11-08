import Image from "next/image";
import { work } from "@/data/work";
import { Section } from "./Section";

export const WORK_TITLE = "Live in production";

export function SelectedWork() {
  return (
    <Section name="work" title={WORK_TITLE}>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-x-12 gap-y-[72px] p-0">
        {work.map((item) => (
          <li key={item.title} className="min-w-0 @min-[760px]:even:mt-24">
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="project block"
            >
              <div className="relative aspect-[2/1] overflow-hidden border border-rule bg-tile">
                {item.shots.map((shot, i) => (
                  <Image
                    key={shot.alt}
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(min-width: 900px) 700px, 100vw"
                    placeholder="blur"
                    // eager: on the monitor the content is moved by a transform, which lazy loading
                    // does not track
                    loading="eager"
                    className={`shot object-cover object-top ${i > 0 ? "shot-next" : ""}`}
                  />
                ))}
              </div>
              <div className="mt-6 font-mono text-[13px] text-dim">
                {item.years}
              </div>
              <h3 className="mt-2 text-[clamp(32px,3.4cqw,52px)] leading-[1.02] font-bold tracking-[-0.035em]">
                {item.title}
              </h3>
              <p className="mt-4 mb-0 max-w-[460px] text-[17px] leading-normal text-pretty text-dim">
                {item.description}
              </p>
              <div className="mt-5">
                <span className="inline-block border-b border-lime pb-0.5 font-mono text-[13px] tracking-[0.02em] whitespace-pre text-lime">
                  {item.site}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
