export type WorkItem = {
  title: string;
  tag: "Internal product";
  description: string;
};

export const work: WorkItem[] = [
  {
    title: "Payment confirmation",
    tag: "Internal product",
    description:
      "Pay a pre-invoice in full cash, full credit, or a mix, with a plain summary of what is charged before the final click.",
  },
  {
    title: "B2B purchasing dashboard",
    tag: "Internal product",
    description:
      "Front-end for the whole flow from purchase request to vendor quotes, proformas, invoices and payments.",
  },
  {
    title: "Design system",
    tag: "Internal product",
    description:
      "Tailwind-based library of 40+ reusable components, built from design tokens and Figma specs.",
  },
];
