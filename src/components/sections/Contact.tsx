import { contact } from "@/data/contact";
import { Section } from "./Section";

export function Contact() {
  return (
    <Section title="Say hello">
      <ul className="flex flex-col gap-3">
        {contact.map((link) => {
          const isExternal = link.href.startsWith("http");

          return (
            <li key={link.label}>
              <a
                href={link.href}
                className="underline decoration-lamp underline-offset-4"
                {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
