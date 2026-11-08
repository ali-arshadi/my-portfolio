import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Familjen_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import Script from "next/script";
import { SCENE_MODE_SCRIPT } from "@/components/scene/sceneMedia";
import "./globals.css";

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-familjen",
});

// The portfolio content (sections/*): a display grotesque and a mono for labels.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-bricolage",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Ali Arshadi",
  description: "Senior front-end developer in Tehran.",
  openGraph: {
    title: "Ali Arshadi",
    description: "Senior front-end developer in Tehran.",
    type: "website",
    locale: "en",
  },
};

// The scene-mode script sets <html data-scene> before the first paint, so the 3D loader only ever shows
// where the scene will load (hence suppressHydrationWarning on <html>).
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${familjen.variable} ${bricolage.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-bg font-sans text-fg antialiased">
        <Script id="scene-mode" strategy="beforeInteractive">
          {SCENE_MODE_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
