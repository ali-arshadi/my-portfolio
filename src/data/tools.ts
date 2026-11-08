// From the resume's Technical Skills, in its order: front-end, state management, API, tools, then
// additional experience.
export const tools = [
  "Vue.js",
  "Nuxt.js",
  "JavaScript",
  "TypeScript",
  "HTML",
  "CSS",
  "Sass",
  "Tailwind CSS",
  "Vuex",
  "Pinia",
  "REST APIs",
  "Git",
  "Docker",
  "React",
  "Next.js",
  "CI/CD",
] as const;

export type Tool = (typeof tools)[number];
