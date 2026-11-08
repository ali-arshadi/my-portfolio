import { about } from "@/data/about";
import { contact } from "@/data/contact";

export const CONTACT_TITLE = "Let’s talk front-end.";

const email = contact.find((link) => link.href.startsWith("mailto:"));
const profiles = contact.filter((link) => link.href.startsWith("http"));

// The links in a row, for the shelf's About panel.
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
    <section
      data-section="contact"
      className="bg-lime px-[clamp(20px,5cqw,72px)] pt-28 text-ink"
    >
      <h2 className="m-0 text-[clamp(56px,11cqw,190px)] leading-[0.88] font-extrabold tracking-[-0.045em] text-balance uppercase">
        {CONTACT_TITLE}
      </h2>
      {email && (
        <div className="mt-[72px]">
          <a
            href={email.href}
            className="mail inline-block text-[clamp(26px,5.6cqw,92px)] leading-[1.2] font-semibold tracking-[-0.035em] break-words"
          >
            {email.href.slice("mailto:".length)}
          </a>
        </div>
      )}
      <ul className="m-0 mt-10 flex list-none flex-wrap gap-3 p-0">
        {profiles.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="lift label flex min-h-[52px] items-center rounded-full border-2 border-ink px-7 text-[14px]"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="label mt-28 mb-0 border-t-2 border-ink py-7">
        {about.languages}
      </p>
    </section>
  );
}
