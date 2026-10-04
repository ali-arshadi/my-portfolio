import type { Metadata } from "next";
import { Familjen_Grotesk } from "next/font/google";
import "./globals.css";

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-familjen",
});

export const metadata: Metadata = {
  title: "Ali Arshadi",
  description: "Front-end developer in Tehran.",
  openGraph: {
    title: "Ali Arshadi",
    description: "Front-end developer in Tehran.",
    type: "website",
    locale: "en",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={familjen.variable}>
      <body className="bg-bg font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
