import { CircleAlert, Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { Factor, Flag } from "@/lib/analysis";
import { cn } from "@/lib/cn";

const TONES = {
  green: { stroke: "#10b981", text: "text-emerald-700 dark:text-emerald-400" },
  blue: { stroke: "#3b82f6", text: "text-blue-700 dark:text-blue-400" },
  amber: { stroke: "#f59e0b", text: "text-amber-700 dark:text-amber-400" },
  red: { stroke: "#ef4444", text: "text-red-600 dark:text-red-400" },
};

export function toneFor(score: number): keyof typeof TONES {
  return score >= 75 ? "green" : score >= 50 ? "blue" : score >= 30 ? "amber" : "red";
}

/** Kruhový ukazatel skóre 0–100 */
export function ScoreGauge({ score, label, sub }: { score: number; label: string; sub?: string }) {
  const tone = TONES[toneFor(score)];
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="size-24 shrink-0 -rotate-90" role="img" aria-label={`${label}: ${score} ze 100`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
          className="transition-[stroke-dasharray] duration-700"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="rotate-90 fill-[var(--fg)] text-[26px] font-semibold" style={{ transformOrigin: "50px 50px" }}>
          {score}
        </text>
      </svg>
      <div>
        <p className={cn("text-lg font-semibold tracking-tight", tone.text)}>{label}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}

export function FactorBars({ factors }: { factors: Factor[] }) {
  return (
    <ul className="space-y-3">
      {factors.map((f) => {
        const ratio = f.max ? f.score / f.max : 0;
        return (
          <li key={f.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-fg">{f.label}</span>
              <span className="tabular text-muted">
                {f.score} / {f.max}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className={cn("h-full rounded-full", ratio >= 0.75 ? "bg-emerald-500" : ratio >= 0.5 ? "bg-blue-500" : ratio >= 0.3 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">{f.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function FlagList({ flags }: { flags: Flag[] }) {
  if (!flags.length)
    return <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">Žádná rizika – vše v pořádku.</p>;
  return (
    <ul className="space-y-1.5">
      {flags.map((f, i) => {
        const Icon = f.level === "critical" ? CircleAlert : f.level === "warning" ? TriangleAlert : Info;
        return (
          <li
            key={i}
            className={cn(
              "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
              f.level === "critical" && "bg-red-500/10 text-red-800 dark:text-red-300",
              f.level === "warning" && "bg-amber-500/10 text-amber-900 dark:text-amber-300",
              f.level === "info" && "bg-surface-2 text-fg-2",
            )}
          >
            <Icon size={14} className="mt-px shrink-0" />
            {f.text}
          </li>
        );
      })}
    </ul>
  );
}

export function Recommendations({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((r, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-fg-2">
          <Lightbulb size={15} className="mt-0.5 shrink-0 text-accent" />
          {r}
        </li>
      ))}
    </ul>
  );
}

export function Metric({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "danger" | "good" }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/40 px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p
        className={cn(
          "tabular mt-0.5 text-base font-semibold tracking-tight",
          tone === "danger" ? "text-red-600 dark:text-red-400" : tone === "good" ? "text-emerald-700 dark:text-emerald-400" : "text-fg",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}
