// From the resume's Technical Skills and the owner's portfolio design, by group.
export const stack = [
  {
    label: "Front-end",
    items: [
      "Vue.js",
      "Nuxt.js",
      "JavaScript",
      "TypeScript",
      "HTML",
      "CSS",
      "Sass",
      "Tailwind CSS",
    ],
  },
  { label: "State management", items: ["Vuex", "Pinia"] },
  { label: "API & integration", items: ["REST APIs"] },
  { label: "Testing", items: ["Vitest", "Jest"] },
  {
    label: "Quality & performance",
    items: [
      "Lighthouse / Web Vitals",
      "Bundle analysis",
      "Accessibility (WCAG / ARIA)",
    ],
  },
  {
    label: "Development tools",
    items: ["Git", "Docker", "CI/CD", "ESLint", "Prettier", "Storybook"],
  },
  { label: "Additional", items: ["React", "Next.js"] },
] as const;

// Every tool, in group order (the shelf panel lists them flat).
export const tools = stack.flatMap((group) => group.items);

export type Tool = (typeof stack)[number]["items"][number];
