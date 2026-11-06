export type About = {
  name: string;
  tagline: string;
  // While it is null, the About panel (the shelf figurine) shows a marked placeholder in its place.
  bio: string | null;
};

// From the resume: its title and summary.
export const about: About = {
  name: "Ali Arshadi",
  tagline: "Senior front-end developer. Vue, Nuxt, JavaScript, TypeScript.",
  bio: "Senior Front-end Developer with 4+ years of experience building and maintaining scalable web applications using Vue.js, Nuxt.js, JavaScript, and TypeScript. Experienced in front-end architecture, technical decision-making, code reviews, performance optimization, and mentoring developers.",
};
