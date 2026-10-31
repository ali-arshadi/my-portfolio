"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { scroll } from "@/components/scene/scrollState";
import { PHASES } from "@/config/camera";

// One GSAP timeline, scrubbed by the scroll through #hero, is the only scroll state: it moves
// scroll.t from 0 to 1 (CameraRig turns that into the camera pose) and fades the hero text out over
// the establishing phase. Nothing here causes a React render.
//
// With reduced motion there is no camera move: once the reader is halfway through the hero, the scene
// fades out, cuts to the screen and fades back in (and the reverse on the way up).
export function ScrollController() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const trigger = {
      trigger: "#hero",
      start: "top top",
      end: "bottom bottom",
    };

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { ...trigger, scrub: 0.6 },
      });
      tl.to(scroll, { t: 1, duration: 1 }, 0);
      tl.fromTo(
        "#hero-overlay",
        { autoAlpha: 1, y: 0 },
        { autoAlpha: 0, y: -48, duration: PHASES.establishing[1] },
        0,
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      let focused = false;
      ScrollTrigger.create({
        ...trigger,
        onUpdate: (self) => {
          gsap.set("#hero-overlay", {
            autoAlpha: self.progress < PHASES.establishing[1] ? 1 : 0,
          });
          const next = self.progress > 0.5;
          if (next === focused) {
            return;
          }
          focused = next;
          gsap
            .timeline()
            .to("#scene", { opacity: 0, duration: 0.2 })
            .add(() => {
              scroll.t = next ? 1 : 0;
            })
            .to("#scene", { opacity: 1, duration: 0.2 });
        },
      });
    });

    return () => mm.revert();
  }, []);

  return null;
}
