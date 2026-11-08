import { contact } from "@/data/contact";
import { Section } from "./Section";

export const CONTACT_TITLE = "Say hello";

export function ContactList({ inline = false }: { inline?: boolean }) {
  return (
    <ul
      className={
        inline ? "flex flex-wrap gap-x-6 gap-y-2" : "flex flex-col gap-3"
      }
    >
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
  );
}

export function Contact() {
  return (
    <Section title={CONTACT_TITLE}>
      <ContactList />
    </Section>
  );
}
