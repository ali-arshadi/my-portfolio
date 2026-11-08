import { about } from "@/data/about";
import { Section } from "./Section";

export function Profile() {
  const { profile } = about;
  return (
    <Section name="profile" title={profile.title}>
      <p className="m-0 max-w-[1100px] text-[clamp(32px,4.4cqw,68px)] leading-[1.04] font-medium tracking-[-0.03em] text-balance">
        {profile.lead}
      </p>
      <div className="mt-16 grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-x-16 gap-y-8 text-lg leading-[1.55] text-dim">
        {profile.paragraphs.map((text) => (
          <p key={text} className="m-0 text-pretty">
            {text}
          </p>
        ))}
      </div>
      <div className="mt-[72px] flex max-w-[1100px] flex-wrap items-baseline gap-x-12 gap-y-3 border-t border-rule pt-6">
        <span className="label flex-[0_0_120px] text-dim">Education</span>
        <p className="m-0 flex-[1_1_320px] text-[clamp(26px,3cqw,44px)] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">
          {profile.education}
        </p>
      </div>
    </Section>
  );
}
