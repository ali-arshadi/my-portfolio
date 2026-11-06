import type { Tool } from "@/data/tools";

// The shelf's books in scene order (book_0 … book_7, left to right as seen from the camera). The spine
// titles are painted into the spine atlas from blender/scripts/config.py BOOKS; keep the two in step.
// Each book opens the tools panel with its entry of src/data/tools.ts marked. Node.js and CSS have no
// entry there, so those books open it with nothing marked.
export const SHELF_BOOKS: readonly { spine: string; tool: Tool | null }[] = [
  { spine: "Vue.js", tool: "Vue.js" },
  { spine: "Node.js", tool: null },
  { spine: "CSS", tool: null },
  { spine: "Next.js", tool: "Next.js" },
  { spine: "Nuxt", tool: "Nuxt.js" },
  { spine: "JavaScript", tool: "JavaScript" },
  { spine: "Git", tool: "Git" },
  { spine: "TypeScript", tool: "TypeScript" },
];
