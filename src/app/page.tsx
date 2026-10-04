import { Hero } from "@/components/hero/Hero";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Tools } from "@/components/sections/Tools";

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
