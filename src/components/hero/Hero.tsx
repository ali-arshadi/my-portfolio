import { DeskCanvasLoader } from "@/components/scene/DeskCanvasLoader";
import { StaticHero } from "./StaticHero";

export function Hero() {
  return (
    <section className="relative flex min-h-dvh flex-col justify-end overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_45%,#14161d_0%,#090a0e_65%)]" />
        <div className="absolute inset-0">
          <DeskCanvasLoader />
        </div>
      </div>
      <StaticHero />
    </section>
  );
}
