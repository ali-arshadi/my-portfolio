// From the resume and the owner's portfolio design (claude.ai design canvas "Ali Arshadi — Portfolio
// Design"), which the owner confirmed as true.
export type About = {
  name: string;
  title: string;
  location: string;
  tagline: string;
  // While it is null, the About panel (the shelf figurine) shows a marked placeholder in its place.
  bio: string | null;
  // What the work is about, as the running band under the intro.
  practices: readonly string[];
  profile: {
    title: string;
    lead: string;
    paragraphs: readonly string[];
    education: string;
  };
  languages: string;
};

export const about: About = {
  name: "Ali Arshadi",
  title: "Senior Front-end Developer",
  location: "Tehran, Iran",
  tagline: "Senior front-end developer. Vue, Nuxt, JavaScript, TypeScript.",
  bio: "Senior Front-end Developer with 4+ years of experience building and maintaining scalable web applications using Vue.js, Nuxt.js, JavaScript, and TypeScript. Experienced in front-end architecture, technical decision-making, code reviews, performance optimization, and mentoring developers.",
  practices: [
    "Architecture",
    "Code review",
    "Performance",
    "Migrations",
    "Refactoring",
    "Design systems",
    "Estimation",
    "Mentoring",
  ],
  profile: {
    title: "Builds & decides",
    lead: "Building scalable web applications, and deciding how they are built, reviewed and migrated.",
    paragraphs: [
      "Currently responsible for front-end technical leadership within a B2B purchasing platform: architecture decisions, pull request approvals, task estimation and legacy code refactoring.",
      "A strong background in REST API integration, state management and reusable component architecture, working closely with design and back-end teams.",
    ],
    education: "Skills beat degrees. The work on this page is the transcript.",
  },
  languages: "Persian: Native · English: Professional working proficiency",
};
