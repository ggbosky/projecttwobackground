"use client";

import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { CapacityChart, type CapacityRow } from "@/components/charts/MoreCharts";
import { Select } from "@/components/ui/controls";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/cn";
import { formatHours, formatMonthLong, formatPercent } from "@/lib/format";
import { WEB_TYPE, WEB_TYPE_ORDER } from "@/lib/status";
import type { WebType } from "@/lib/types";

export interface PlannerMonth extends CapacityRow {
  slots: number;
  utilization: number;
}

/**
 * Kapacitní plánovač: kolik nových webů zvládneme nabrat.
 * Simulátor počítá s průměrnou měsíční náročností daného typu webu
 * (z historie dokončených projektů).
 */
export function CapacityPlanner({ months, perTypeMonthlyHours }: { months: PlannerMonth[]; perTypeMonthlyHours: Record<WebType, number> }) {
  const [type, setType] = useState<WebType>("presentation");
  const [count, setCount] = useState(1);
  const [monthIdx, setMonthIdx] = useState(1);

  const m = months[monthIdx];
  const need = perTypeMonthlyHours[type] * count;
  const fits = need <= m.free;
  const tight = !fits && need <= m.free + m.buffer;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <div className="xl:col-span-3">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {months.map((mo, i) => (
            <button
              key={mo.month}
              onClick={() => setMonthIdx(i)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                monthIdx === i ? "border-accent/50 bg-accent-soft" : "border-line bg-surface-2/40 hover:border-line-strong",
              )}
            >
              <p className="text-[11px] text-muted first-letter:uppercase">
                {i === 0 ? "Zbytek měsíce" : formatMonthLong(mo.month)}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-fg">
                {mo.slots} <span className="text-xs font-normal text-muted">{mo.slots === 1 ? "web" : mo.slots >= 2 && mo.slots <= 4 ? "weby" : "webů"}</span>
              </p>
              <p className="tabular text-[11px] text-muted">volno {formatHours(mo.free)}</p>
              <Progress className="mt-2" value={mo.utilization} tone="auto" label="Vytížení" />
              <p className="tabular mt-1 text-[10px] text-muted">vytížení {formatPercent(mo.utilization)}</p>
            </button>
          ))}
        </div>
        <p className="mb-4 -mt-1 text-[11px] text-muted">
          Sloty = volná kapacita po odečtení rezervy a vážené pipeline otevřených nabídek, děleno průměrnou měsíční náročností webu.
        </p>
        <CapacityChart data={months} />
      </div>

      <div className="rounded-xl border border-line bg-surface-2/40 p-4 xl:col-span-2">
        <p className="text-sm font-semibold text-fg">Simulátor nové zakázky</p>
        <p className="mb-4 text-xs text-muted">Zvládneme nabrat další projekt? Vyberte typ, počet a měsíc.</p>
        <div className="space-y-3">
          <Select
            label="Typ webu"
            value={type}
            onChange={(v) => setType(v as WebType)}
            options={WEB_TYPE_ORDER.map((t) => ({ value: t, label: `${WEB_TYPE[t].label} · ~${Math.round(perTypeMonthlyHours[t])} h/měs.` }))}
            className="w-full"
          />
          <Select
            label="Měsíc"
            value={String(monthIdx)}
            onChange={(v) => setMonthIdx(Number(v))}
            options={months.map((mo, i) => ({ value: String(i), label: i === 0 ? `Zbytek měsíce (${formatMonthLong(mo.month)})` : formatMonthLong(mo.month) }))}
            className="w-full"
          />
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <label htmlFor="count" className="text-fg-2">
                Počet nových webů
              </label>
              <span className="tabular font-semibold text-fg">{count}</span>
            </div>
            <input
              id="count"
              type="range"
              min={1}
              max={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-line bg-surface p-3 text-xs">
          <Line label="Potřeba" value={formatHours(need)} />
          <Line label="Volná kapacita" value={formatHours(m.free)} />
          <Line label="Rezerva (15 %)" value={formatHours(m.buffer)} />
          <Line label="Vážená pipeline nabídek" value={formatHours(m.pipeline)} muted />
        </div>

        <div
          className={cn(
            "mt-3 flex items-start gap-2 rounded-lg p-3 text-xs",
            fits
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : tight
                ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
                : "bg-red-500/10 text-red-800 dark:text-red-300",
          )}
        >
          {fits ? <CircleCheck size={15} className="mt-px shrink-0" /> : tight ? <TriangleAlert size={15} className="mt-px shrink-0" /> : <CircleAlert size={15} className="mt-px shrink-0" />}
          <span>
            {fits
              ? `Ano – zbyde ${formatHours(m.free - need)} volné kapacity.`
              : tight
                ? `Jen s využitím rezervy (chybí ${formatHours(need - m.free)}). Riziko pro podporu a SLA.`
                : `Ne – chybí ${formatHours(need - m.free)}. Zvažte posunutí startu nebo externího freelancera.`}
          </span>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={cn("tabular font-medium", muted ? "text-fg-2" : "text-fg")}>{value}</span>
    </div>
  );
}
