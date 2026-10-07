"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { formatCZK, formatCZKCompact, formatHours, formatNumber, formatPercent } from "@/lib/format";
import { WEB_TYPE } from "@/lib/status";
import type { ProjectStatus, WebType } from "@/lib/types";

export interface ProfitRow {
  id: string;
  name: string;
  client: string;
  type: WebType;
  status: ProjectStatus;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  effectiveRate: number;
  estimatedHours: number;
  forecastHours: number;
  isProjection: boolean;
}

type SortKey = "profit" | "margin" | "effectiveRate" | "revenue" | "hours";
type Scope = "all" | "done" | "active";

export function ProfitabilityTable({ rows, targetMargin }: { rows: ProfitRow[]; targetMargin: number }) {
  const [scope, setScope] = useState<Scope>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "margin", dir: -1 });

  const filtered = useMemo(() => {
    const list = rows.filter((r) =>
      scope === "all" ? true : scope === "done" ? !r.isProjection : r.isProjection,
    );
    const val = (r: ProfitRow) =>
      sort.key === "hours" ? r.forecastHours / Math.max(1, r.estimatedHours) : (r[sort.key] as number);
    return [...list].sort((a, b) => (val(a) - val(b)) * sort.dir);
  }, [rows, scope, sort]);

  const totals = filtered.reduce(
    (s, r) => ({ revenue: s.revenue + r.revenue, cost: s.cost + r.cost, profit: s.profit + r.profit }),
    { revenue: 0, cost: 0, profit: 0 },
  );

  const SortHeader = ({ k, children, className }: { k: SortKey; children: ReactNode; className?: string }) => (
    <th className={cn("px-3 py-2.5 font-medium", className)}>
      <button
        onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : -1 }))}
        className="inline-flex items-center gap-1 hover:text-fg"
      >
        {children}
        {sort.key === k ? (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
      </button>
    </th>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3">
        <Segmented
          label="Rozsah"
          value={scope}
          onChange={setScope}
          options={[
            { value: "all", label: "Vše" },
            { value: "done", label: "Uzavřené" },
            { value: "active", label: "Běžící (projekce)" },
          ]}
        />
        <p className="text-xs text-muted">
          Cílová marže {formatPercent(targetMargin)} · náklady = hodiny × plně zatížená sazba týmu (mzda + režie) + externí náklady
        </p>
      </div>
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-muted">
              <th className="px-5 py-2.5 font-medium">Projekt</th>
              <SortHeader k="revenue" className="text-right">Příjem</SortHeader>
              <th className="px-3 py-2.5 text-right font-medium">Náklady</th>
              <SortHeader k="profit" className="text-right">Zisk</SortHeader>
              <SortHeader k="margin">Marže</SortHeader>
              <SortHeader k="effectiveRate" className="text-right">Ef. sazba</SortHeader>
              <SortHeader k="hours" className="pr-5 text-right">Hodiny plán → realita</SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => {
              const overrun = r.forecastHours / Math.max(1, r.estimatedHours) - 1;
              return (
                <tr key={r.id} className="group transition-colors hover:bg-surface-2/60">
                  <td className="px-5 py-3">
                    <Link href={`/projects/${r.id}`} className="font-medium text-fg group-hover:text-accent">
                      {r.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <span>{r.client}</span>·<span>{WEB_TYPE[r.type].label}</span>
                      <ProjectStatusBadge status={r.status} short />
                    </div>
                  </td>
                  <td className="tabular px-3 py-3 text-right text-fg">{formatCZK(r.revenue)}</td>
                  <td className="tabular px-3 py-3 text-right text-fg-2">{formatCZK(r.cost)}</td>
                  <td
                    className={cn(
                      "tabular px-3 py-3 text-right font-medium",
                      r.profit < 0 ? "text-red-600 dark:text-red-400" : "text-fg",
                    )}
                  >
                    {formatCZK(r.profit)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 rounded-full",
                            r.margin < 0 ? "bg-red-500" : r.margin < targetMargin ? "bg-amber-500" : "bg-emerald-500",
                          )}
                          style={{ width: `${Math.min(100, Math.abs(r.margin) * 100)}%` }}
                        />
                        <div className="absolute inset-y-0 w-px bg-fg/40" style={{ left: `${targetMargin * 100}%` }} />
                      </div>
                      <span className="tabular w-12 text-xs text-fg-2">{formatPercent(r.margin)}</span>
                    </div>
                  </td>
                  <td className="tabular px-3 py-3 text-right whitespace-nowrap text-fg-2">
                    {r.effectiveRate > 0 ? `${formatNumber(r.effectiveRate)} Kč/h` : "—"}
                  </td>
                  <td className="tabular px-3 py-3 pr-5 text-right text-xs">
                    <span className="text-muted">{formatHours(r.estimatedHours)} → </span>
                    <span className="text-fg">{formatHours(r.forecastHours)}</span>
                    {Math.abs(overrun) >= 0.01 && (
                      <span
                        className={cn(
                          "ml-1.5 font-medium",
                          overrun > 0.1 ? "text-red-600 dark:text-red-400" : overrun > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400",
                        )}
                      >
                        {overrun > 0 ? "+" : ""}
                        {formatPercent(overrun)}
                      </span>
                    )}
                    {r.isProjection && <span className="block text-[10px] text-muted">projekce</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong bg-surface-2/50 text-sm font-medium">
              <td className="px-5 py-3 text-fg">Celkem ({filtered.length})</td>
              <td className="tabular px-3 py-3 text-right text-fg">{formatCZKCompact(totals.revenue)}</td>
              <td className="tabular px-3 py-3 text-right text-fg-2">{formatCZKCompact(totals.cost)}</td>
              <td className="tabular px-3 py-3 text-right text-fg">{formatCZKCompact(totals.profit)}</td>
              <td className="tabular px-3 py-3 text-xs text-fg-2" colSpan={3}>
                Průměrná marže {totals.revenue ? formatPercent(totals.profit / totals.revenue, 1) : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
