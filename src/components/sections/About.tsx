import { about } from "@/data/about";
import { Section } from "./Section";

export const ABOUT_TITLE = "About";

// Only on the static page (#content): in 3D mode the shelf figurine's panel shows the bio.
export function About() {
  return about.bio ? (
    <Section title={ABOUT_TITLE}>
      <p className="max-w-prose text-lg text-muted">{about.bio}</p>
    </Section>
  ) : null;
}
