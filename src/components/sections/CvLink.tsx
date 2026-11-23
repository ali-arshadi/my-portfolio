import { CV } from "@/data/contact";

// Phosphor "download-simple", outline, beside visible text so it stays decorative.
function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 256 256"
      width={20}
      height={20}
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={16}
        d="M48 160v40a8 8 0 0 0 8 8h144a8 8 0 0 0 8-8v-40M88 112l40 40 40-40M128 40v112"
      />
    </svg>
  );
}

type Tone = "accent" | "ink";

const tones: Record<Tone, string> = {
  // Lime contact block: filled ink chip, lime type
  accent:
    "border-2 border-ink bg-ink text-accent hover:bg-transparent hover:text-ink",
  // Dark folio: outlined bone chip
  ink: "border-2 border-paper text-paper hover:border-accent hover:text-accent",
};

export function CvLink({ tone }: { tone: Tone }) {
  return (
    <a
      href={CV.href}
      download={CV.download}
      className={`lift label inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-7 text-[14px] whitespace-nowrap transition-colors ${tones[tone]}`}
    >
      <DownloadIcon />
      {CV.label}
    </a>
  );
}
