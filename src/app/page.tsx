import { Hero } from "@/components/hero/Hero";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Tools } from "@/components/sections/Tools";

// In 3D mode the sections are shown on the monitor (MonitorScreen); in the static fallback (narrow
// screens, no WebGL 2) the page shows them below the hero instead. globals.css switches on data-scene.
export default function Home() {
  return (
    <main>
      <Hero />
      <div
        id="content"
        className="relative z-[2] bg-bg shadow-[0_-60px_80px_20px_#090a0e]"
      >
        <SelectedWork />
        <Tools />
        <Experience />
        <Contact />
      </div>
    </main>
  );
}
