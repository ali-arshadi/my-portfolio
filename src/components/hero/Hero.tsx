import { DeskCanvasLoader } from "@/components/scene/DeskCanvasLoader";
import { StaticHero } from "./StaticHero";

export function Hero() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_45%,#14161d_0%,#090a0e_65%)]" />
        <div className="absolute inset-0">
          <DeskCanvasLoader />
        </div>
      </div>
      <section id="hero" className="relative z-[1] h-[240vh]">
        <div className="sticky top-0 flex h-dvh flex-col justify-end">
          <StaticHero />
        </div>
      </section>
    </>
  );
}
