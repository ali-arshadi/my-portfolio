"use client";

import { useEffect, useRef } from "react";

export type ScrollProgress = {
  p: number;
  e: number;
};

function readProgress(heroSelector: string): ScrollProgress {
  const hero = document.querySelector<HTMLElement>(heroSelector);
  if (!hero) {
    return { p: 0, e: 0 };
  }

  const span = hero.offsetHeight - window.innerHeight;
  const p = Math.min(Math.max(window.scrollY / Math.max(span, 1), 0), 1);
  const e = p * p * (3 - 2 * p);
  return { p, e };
}

export function useScrollProgress(heroSelector = "#hero") {
  const progress = useRef<ScrollProgress>({ p: 0, e: 0 });

  useEffect(() => {
    const update = () => {
      progress.current = readProgress(heroSelector);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [heroSelector]);

  return progress;
}
