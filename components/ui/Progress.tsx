import { cn } from "@/lib/cn";

/** Lineární ukazatel. Barva výplně nese závažnost (accent → varování → přetížení). */
export function Progress({
  value,
  max = 1,
  tone = "accent",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "accent" | "good" | "warn" | "danger" | "auto";
  className?: string;
  label?: string;
}) {
  const ratio = max > 0 ? value / max : 0;
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  const resolved =
    tone === "auto" ? (ratio > 1 ? "danger" : ratio > 0.9 ? "warn" : ratio < 0.5 ? "good" : "accent") : tone;
  const fill = {
    accent: "bg-accent",
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    danger: "bg-red-500",
  }[resolved];
  const track = {
    accent: "bg-accent-soft",
    good: "bg-emerald-500/15",
    warn: "bg-amber-500/15",
    danger: "bg-red-500/15",
  }[resolved];
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full", track, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}
