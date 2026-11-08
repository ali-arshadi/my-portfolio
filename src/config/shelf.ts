import type { Tool } from "@/data/tools";

// The shelf's books in scene order (book_0 … book_7, left to right as seen from the camera). The spine
// titles are painted into the spine atlas from blender/scripts/config.py BOOKS; keep the two in step.
// Each book opens the stack panel with its entry of src/data/tools.ts marked. Every spine names a
// tool from the stack; "Tailwind" is short for Tailwind CSS, as the full name does not fit the spine.
export const SHELF_BOOKS: readonly { spine: string; tool: Tool | null }[] = [
  { spine: "Vue.js", tool: "Vue.js" },
  { spine: "Tailwind", tool: "Tailwind CSS" },
  { spine: "CSS", tool: "CSS" },
  { spine: "Next.js", tool: "Next.js" },
  { spine: "Nuxt", tool: "Nuxt.js" },
  { spine: "JavaScript", tool: "JavaScript" },
  { spine: "Git", tool: "Git" },
  { spine: "TypeScript", tool: "TypeScript" },
];
