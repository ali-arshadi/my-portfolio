// From the owner's portfolio design and the resume.
export type WorkItem = {
  title: string;
  years: string;
  description: string;
  href: string;
  site: string;
  // PLACEHOLDER: no screenshots yet; the card shows this label in a striped box until one is added.
  screenshot: string;
};

export const work: WorkItem[] = [
  {
    title: "Achareh Bazaar",
    years: "2025 – Now",
    description: "Where I lead front-end development today.",
    href: "https://acharehbazaar.com",
    site: "acharehbazaar.com",
    screenshot: "[Screenshot: purchasing dashboard]",
  },
  {
    title: "Achareh Sazeh",
    years: "2025",
    description: "Maintenance dashboard for the Achareh Group.",
    href: "https://sazeh.achareh.ir",
    site: "sazeh.achareh.ir  ·  /pricing",
    screenshot: "[Screenshot: maintenance dashboard]",
  },
  {
    title: "Mavida Home",
    years: "2023 – 2025",
    description: "Freelance front-end work during my military service.",
    href: "https://mavidahome.com/",
    site: "mavidahome.com",
    screenshot: "[Screenshot: Mavida Home]",
  },
];

// The featured product: its request-to-payment flow and the Vue 2 to Vue 3 migration plan.
export const featured = {
  name: ["Achareh", "Bazaar"],
  lead: "A B2B purchasing dashboard inside the Achareh Group, designed and built front end to back.",
  flowTitle: "Request to payment",
  flow: [
    "Purchase request",
    "Vendor quotation",
    "Proforma",
    "Invoice",
    "Payment",
  ],
  migrationTitle: "Crossing the bridge",
  migrationFrom: "Vue 2 · Nuxt 2",
  migrationVia: "Nuxt Bridge",
  migrationTo: "Vue 3 · Nuxt 4",
  migration: [
    { from: "Vuex", to: "Pinia" },
    { from: "Mixins", to: "Composables" },
    { from: "Vue 2 components", to: "Composition API + TypeScript" },
    { from: "Middleware & plugins", to: "Refactored" },
    { from: "Dependencies & Tailwind", to: "Upgraded" },
  ],
  migrationNote:
    "I defined this strategy and lead its technical planning, with a gradual move to the Vue 3 Composition API with TypeScript.",
} as const;
