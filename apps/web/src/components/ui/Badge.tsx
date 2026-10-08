import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "positive" | "negative" | "brand" | "sample";

const tones: Record<Tone, string> = {
  neutral: "bg-blush text-ink",
  positive: "bg-[#e3f0e9] text-positive",
  negative: "bg-[#f6e3e3] text-negative",
  brand: "bg-primary text-white",
  sample: "border border-dashed border-rose bg-canvas text-primary",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
