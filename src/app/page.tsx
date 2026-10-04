import { Hero } from "@/components/hero/Hero";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Tools } from "@/components/sections/Tools";

export default function Home() {
  return (
    <main>
      <Hero />
      <div id="content" className="relative bg-bg">
        <SelectedWork />
        <Tools />
        <Experience />
        <Contact />
      </div>
    </main>
  );
}
