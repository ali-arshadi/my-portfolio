import { Hero } from "@/components/hero/Hero";
import { Portfolio } from "@/components/sections/Portfolio";
import { SiteIntro } from "@/components/sections/SiteIntro";

// In 3D mode (desktop) the portfolio is shown on the monitor (MonitorScreen); on phones and tablets
// (and without WebGL 2) the page is the site itself, with no scene. globals.css switches on data-scene.
export default function Home() {
  return (
    <main>
      <Hero />
      <div id="content" className="relative z-[2]">
        <SiteIntro />
        <Portfolio />
      </div>
    </main>
  );
}
