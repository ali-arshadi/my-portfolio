"use client";

import dynamic from "next/dynamic";

const DeskCanvas = dynamic(() => import("./DeskCanvas"), { ssr: false });

export function DeskCanvasLoader() {
  return <DeskCanvas />;
}
