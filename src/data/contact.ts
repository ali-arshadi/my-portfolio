export type ContactLink = {
  label: string;
  href: string;
};

export const contact: ContactLink[] = [
  {
    label: "Email",
    href: "mailto:aliarshadi619@gmail.com",
  },
  {
    label: "GitHub",
    href: "https://github.com/ali-arshadi",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/ali-arshadi",
  },
];

// The GitHub profile, which the shelf's figurine (a GitHub-style cat) opens.
export const GITHUB = contact.find((link) => link.label === "GitHub")!;
