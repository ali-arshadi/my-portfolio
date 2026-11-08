import { Hero } from "@/components/hero/Hero";
import { Portfolio } from "@/components/sections/Portfolio";

// In 3D mode the portfolio is shown on the monitor (MonitorScreen); in the static fallback (narrow
// screens, no WebGL 2) the page shows it below the hero instead. globals.css switches on data-scene.
export default function Home() {
  return (
    <main>
      <Hero />
      <div
        id="content"
        className="relative z-[2] shadow-[0_-60px_80px_20px_#0d0d0b]"
      >
        <Portfolio />
      </div>
    </main>
  );
}
