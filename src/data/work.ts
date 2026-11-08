export type WorkItem = {
  title: string;
  tag: "Internal product" | "Product feature";
  description: string;
};

// From the resume: one entry per product, worded from its bullet points.
export const work: WorkItem[] = [
  {
    title: "B2B purchasing dashboard",
    tag: "Internal product",
    description:
      "Front-end for the whole flow from purchase requests to vendor quotations, proformas, invoices and payments, built with Vue 2, Nuxt 2, Vuex, Tailwind CSS and REST APIs. Build time cut from about 15-18 minutes to 7-8.",
  },
  {
    title: "Maintenance dashboard",
    tag: "Internal product",
    description:
      "Sass-based maintenance dashboard built with Vue 2 and Nuxt 2, with reusable components, while migrating legacy components toward Vue 3, Nuxt 3 and the Composition API.",
  },
  {
    title: "Video conferencing",
    tag: "Product feature",
    description:
      "The video conferencing feature of a collaboration platform that combines project management and team communication, built with Vue.js and TypeScript.",
  },
];
