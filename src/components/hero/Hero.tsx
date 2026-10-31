import { DeskCanvasLoader } from "@/components/scene/DeskCanvasLoader";
import { ScreenLayer } from "@/components/screen/ScreenLayer";
import { ScrollController } from "./ScrollController";
import { StaticHero } from "./StaticHero";

// The scene stays fixed behind the page. #hero is pinned by ScrollController for as long as the camera
// move and the monitor's content take to scroll. It lets clicks through to the monitor's content,
// which is drawn in ScreenLayer, over the canvas but outside its aria-hidden wrapper.
export function Hero() {
  return (
    <>
      <div id="scene" className="pointer-events-none fixed inset-0 z-0">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_45%,#14161d_0%,#090a0e_65%)]"
        />
        <div aria-hidden="true" className="absolute inset-0">
          <DeskCanvasLoader />
        </div>
        <ScreenLayer />
      </div>
      <section
        id="hero"
        className="pointer-events-none relative z-[1] flex h-dvh flex-col justify-end"
      >
        <StaticHero />
      </section>
      <ScrollController />
    </>
  );
}
