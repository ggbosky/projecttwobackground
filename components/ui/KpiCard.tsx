import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { Card } from "./Card";

/**
 * Stat tile: popisek · hodnota · (volitelně) změna vs. pojmenované období · nápověda.
 * Barva změny = směr × zda je růst dobrý.
 */
export function KpiCard({
  label,
  value,
  icon,
  delta,
  deltaLabel,
  upIsGood = true,
  hint,
  children,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  delta?: number;
  deltaLabel?: string;
  upIsGood?: boolean;
  hint?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  const good = positive === upIsGood;
  return (
    <Card className={cn("group relative overflow-hidden p-4 hover:border-line-strong", className)} as="div">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        {icon && (
          <span className="rounded-md border border-line bg-surface-2 p-1.5 text-fg-2 transition-colors group-hover:text-accent">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-fg">{value}</div>
      <div className="mt-1.5 flex min-h-[18px] flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {typeof delta === "number" && Number.isFinite(delta) && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              good ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
            )}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {positive ? "+" : ""}
            {formatPercent(delta, 1)}
          </span>
        )}
        {deltaLabel && <span className="text-muted">{deltaLabel}</span>}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
      {children}
    </Card>
  );
}
