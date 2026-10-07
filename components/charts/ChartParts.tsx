"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Společné nastavení os – recesivní, tenké, bez čar os */
export const axisProps = {
  stroke: "var(--muted)",
  tick: { fill: "var(--muted)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  stroke: "var(--grid)",
  strokeDasharray: "0",
  vertical: false,
} as const;

export const cursorFill = { fill: "var(--surface-3)", opacity: 0.6 };

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  emphasis?: boolean;
}

export function TooltipBox({ title, rows, footer }: { title?: ReactNode; rows: TooltipRow[]; footer?: ReactNode }) {
  return (
    <div className="min-w-44 rounded-lg border border-line-strong bg-surface/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      {title && <p className="mb-1.5 font-medium text-fg">{title}</p>}
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className={cn("flex items-center gap-2", r.emphasis && "mt-1 border-t border-line pt-1.5")}>
            {r.color && <span className="size-2 shrink-0 rounded-sm" style={{ background: r.color }} />}
            <span className="text-fg-2">{r.label}</span>
            <span className={cn("tabular ml-auto pl-3 text-fg", r.emphasis ? "font-semibold" : "font-medium")}>{r.value}</span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-1.5 text-[11px] text-muted">{footer}</div>}
    </div>
  );
}

/** HTML legenda nad grafem – identita nikdy jen barvou (swatch + text) */
export function Legend({ items, className }: { items: { label: string; color: string; kind?: "square" | "line" }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-2", className)}>
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          {i.kind === "line" ? (
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: i.color }} />
          ) : (
            <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Minimální props, které Recharts předává vlastnímu obsahu tooltipu */
export interface TipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}
