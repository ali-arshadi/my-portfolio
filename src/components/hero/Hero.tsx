import Image from "next/image";
import openingFrame from "@/assets/opening-frame.webp";
import { DeskCanvasLoader } from "@/components/scene/DeskCanvasLoader";
import { ScreenLayer } from "@/components/screen/ScreenLayer";
import { ShelfPanel } from "@/components/shelf/ShelfPanel";
import { Loader } from "./Loader";
import { ScrollController } from "./ScrollController";
import { StaticHero } from "./StaticHero";

// The scene stays fixed behind the page. In static mode it is a render of the opening frame
// (blender/scripts/render_still.py); in 3D mode the full-screen Loader covers the page until the live
// scene is ready and then reveals it directly (the still is hidden there, and lazy, so it is not even
// downloaded). #hero is pinned by ScrollController for as long as the camera move and the monitor's
// content take to scroll. It lets clicks through to the monitor's
// content, which is drawn in ScreenLayer, over the canvas but outside its aria-hidden wrapper.
// ShelfPanel holds the panels the shelf objects open; it sits outside #hero, which takes no clicks.
export function Hero() {
  return (
    <>
      <div id="scene" className="pointer-events-none fixed inset-0 z-0">
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src={openingFrame}
            alt=""
            fill
            fetchPriority="high"
            sizes="100vw"
            quality={80}
            placeholder="blur"
            className="scene-still object-cover object-[40%_50%]"
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
      <ShelfPanel />
      <ScrollController />
      <Loader />
    </>
  );
}
