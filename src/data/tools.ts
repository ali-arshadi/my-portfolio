export const tools = [
  "Vue.js",
  "Nuxt.js",
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Tailwind CSS",
  "Sass",
  "Pinia",
  "Vuex",
  "REST APIs",
  "Git",
  "Docker",
  "Figma",
] as const;

export type Tool = (typeof tools)[number];
