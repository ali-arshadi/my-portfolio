"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useSyncExternalStore } from "react";
import { scroll, screenScroll } from "@/components/scene/scrollState";
import { PHASES } from "@/config/camera";

// Scroll spent on the camera move, in viewport heights.
const CAMERA_SCROLL = 2.2;

// The viewport height, updated once a resize settles (the timeline is rebuilt when it changes).
let height = 0;
const viewportHeight = () => (height ||= window.innerHeight);
function subscribeViewport(onChange: () => void) {
  let timer = 0;
  const onResize = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      height = window.innerHeight;
      onChange();
    }, 200);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("resize", onResize);
  };
}

// One GSAP timeline, scrubbed by the scroll while #hero is pinned, is the only scroll state:
//   1. the camera move: scroll.t 0 -> 1 (CameraRig turns it into the camera pose), with the hero text
//      fading out over the establishing phase;
//   2. the monitor's content: scroll.content 0 -> 1 (MonitorScreen moves it up), one page pixel per
//      content pixel, so the reader scrolls the page and the text on the screen follows.
// The pin lasts as long as both, so the page gets taller by the content's length. Nothing here
// causes a React render while scrolling.
//
// With reduced motion there is no camera move: once the reader is halfway through it, the scene fades
// out, cuts to the screen and fades back in (and the reverse on the way up). The content still
// scrolls with the page.
export function ScrollController() {
  const distance = useSyncExternalStore(
    screenScroll.subscribe,
    screenScroll.get,
    () => 0,
  );
  const viewport = useSyncExternalStore(
    subscribeViewport,
    viewportHeight,
    () => 0,
  );

  useEffect(() => {
    if (!viewport) {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    // durations are in pixels of scroll, so the content moves one pixel per pixel scrolled
    const camera = CAMERA_SCROLL * viewport;
    const trigger = {
      trigger: "#hero",
      start: "top top",
      end: `+=${camera + distance}`,
      pin: true,
    };

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { ...trigger, scrub: 0.6 },
      });
      tl.to(scroll, { t: 1, duration: camera }, 0);
      tl.fromTo(
        "#hero-overlay",
        { autoAlpha: 1, y: 0 },
        { autoAlpha: 0, y: -48, duration: camera * PHASES.establishing[1] },
        0,
      );
      tl.to(scroll, { content: 1, duration: distance || 1e-6 }, camera);
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      const cut = { k: 0 };
      let focused = false;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { ...trigger, scrub: true },
      });
      tl.to(
        cut,
        {
          k: 1,
          duration: camera,
          onUpdate: () => {
            gsap.set("#hero-overlay", {
              autoAlpha: cut.k < PHASES.establishing[1] ? 1 : 0,
            });
            const next = cut.k > 0.5;
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
        },
        0,
      );
      tl.to(scroll, { content: 1, duration: distance || 1e-6 }, camera);
    });

    // a trigger made after the page's load event is not measured until something refreshes it
    ScrollTrigger.refresh();

    // On wide screens the content is on the monitor, so "Skip to content" scrolls to the point where
    // the camera has arrived at it.
    const skip =
      document.querySelector<HTMLAnchorElement>('a[href="#content"]');
    const onSkip = (event: MouseEvent) => {
      if (!distance) {
        return;
      }
      event.preventDefault();
      const hero = ScrollTrigger.getAll().find((st) => st.pin);
      window.scrollTo({ top: (hero?.start ?? 0) + camera });
    };
    skip?.addEventListener("click", onSkip);

    return () => {
      skip?.removeEventListener("click", onSkip);
      mm.revert();
    };
  }, [distance, viewport]);

  return null;
}
