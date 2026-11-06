import Image from "next/image";
import openingFrame from "@/assets/opening-frame.webp";
import { DeskCanvasLoader } from "@/components/scene/DeskCanvasLoader";
import { ScreenLayer } from "@/components/screen/ScreenLayer";
import { Loader } from "./Loader";
import { ScrollController } from "./ScrollController";
import { StaticHero } from "./StaticHero";

// The scene stays fixed behind the page. Its first layer is a render of the opening frame
// (blender/scripts/render_still.py), the whole hero in static mode; in 3D mode the full-screen Loader
// covers the page until the scene is ready, then reveals it. #hero is pinned by ScrollController for as long as the
// camera move and the monitor's content take to scroll. It lets clicks through to the monitor's
// content, which is drawn in ScreenLayer, over the canvas but outside its aria-hidden wrapper.
export function Hero() {
  return (
    <>
      <div id="scene" className="pointer-events-none fixed inset-0 z-0">
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src={openingFrame}
            alt=""
            fill
            preload
            sizes="100vw"
            quality={80}
            placeholder="blur"
            className="object-cover object-[40%_50%]"
          />
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
      <Loader />
    </>
  );
}
