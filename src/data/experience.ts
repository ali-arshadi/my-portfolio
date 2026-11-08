// From the resume and the owner's portfolio design, newest first.
export type ExperienceItem = {
  company: string;
  // what and where, in one line under the company
  sub: string;
  // ISO months for <time dateTime>; null where the design gives only a length
  start: string | null;
  end: string | null;
  dates: string;
  tags: readonly string[];
  bullets: readonly string[];
};

export const experience: ExperienceItem[] = [
  {
    company: "Achareh Bazaar",
    sub: "Achareh Group · Internal venture · Senior Front-end Developer",
    start: "2025-12",
    end: null,
    dates: "Dec 2025 – Present",
    tags: ["Vue 2", "Nuxt 2", "Vuex", "Tailwind CSS", "REST APIs"],
    bullets: [
      "Lead front-end development and act as primary technical decision-maker: pull request approvals, architecture decisions, code reviews and task estimation.",
      "Integrated a Tailwind CSS design system created by the design team, improving UI consistency and code readability.",
      "Refactored legacy code and reorganized the architecture for maintainability, reusability and future migration.",
      "Contribute to CI/CD workflows; Git and Docker throughout delivery.",
    ],
  },
  {
    company: "Achareh Sazeh",
    sub: "Achareh Group · Internal venture · Front-end Developer",
    start: "2025-06",
    end: "2025-12",
    dates: "Jun 2025 – Dec 2025",
    tags: ["Vue 2", "Nuxt 2", "Sass"],
    bullets: [
      "Developed and enhanced a Sass-based maintenance dashboard using Vue 2 and Nuxt 2.",
      "Built reusable components and translated business requirements and UI/UX designs into responsive features.",
      "Contributed to migrating legacy components toward Vue 3, Nuxt 3 and the Composition API.",
      "Maintained the legacy platform, preserving backward compatibility during the transition.",
    ],
  },
  {
    company: "Freelance",
    sub: "Front-end Developer · alongside military service",
    start: null,
    end: null,
    dates: "≈ 1 year",
    tags: [],
    bullets: [
      "Front-end delivery for Mavida Home, alongside compulsory military service (Aug 2023 – May 2025).",
    ],
  },
  {
    company: "Nira",
    sub: "Collaboration platform · Front-end Developer",
    start: "2023-03",
    end: "2023-07",
    dates: "Mar 2023 – Jul 2023",
    tags: ["Vue.js", "TypeScript", "REST APIs"],
    bullets: [
      "Contributed to a platform combining project management, team communication and video conferencing.",
      "Designed and developed the video conferencing feature using Vue.js and TypeScript.",
      "Translated UI/UX designs into responsive, interactive interfaces with consistent visuals across the product.",
      "Integrated REST APIs and application state to support workflows between front end and back end.",
      "Worked closely with designers and back-end developers on new features.",
    ],
  },
  {
    company: "Webclicks",
    sub: "Client projects · Front-end Developer",
    start: "2021-08",
    end: "2023-02",
    dates: "Aug 2021 – Feb 2023",
    tags: ["Vue.js", "JavaScript", "HTML", "CSS", "Git"],
    bullets: [
      "Developed responsive web applications for multiple clients, from e-commerce platforms to portfolio and corporate websites.",
      "Built dynamic interfaces and integrated APIs with back-end teams.",
      "Maintained and refactored codebases for performance, maintainability and cross-browser compatibility.",
    ],
  },
];
