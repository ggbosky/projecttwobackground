"use client";

import { CircleCheck, CircleX, Quote } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { FilterChip, Segmented, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { clientName, projects } from "@/lib/data";
import { formatCZK, formatPercent } from "@/lib/format";
import { WEB_TYPE, WEB_TYPE_ORDER } from "@/lib/status";
import type { WebType } from "@/lib/types";

type Outcome = "all" | "won" | "failed";

export function CaseStudies() {
  const [outcome, setOutcome] = useState<Outcome>("all");
  const [types, setTypes] = useState<WebType[]>([]);
  const [minRating, setMinRating] = useState("0");
  const [sort, setSort] = useState("date");

  const list = useMemo(() => {
    return projects
      .filter((p) => ["completed", "cancelled", "lost"].includes(p.status))
      .filter((p) => (outcome === "won" ? p.status === "completed" : outcome === "failed" ? p.status !== "completed" : true))
      .filter((p) => (types.length ? types.includes(p.type) : true))
      .filter((p) => (Number(minRating) > 0 ? (p.rating ?? 0) >= Number(minRating) : true))
      .sort((a, b) => {
        if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
        if (sort === "price") return b.price - a.price;
        return (b.actualEndDate ?? b.plannedEndDate).localeCompare(a.actualEndDate ?? a.plannedEndDate);
      });
  }, [outcome, types, minRating, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <Segmented
          label="Výsledek"
          value={outcome}
          onChange={setOutcome}
          options={[
            { value: "all", label: "Vše" },
            { value: "won", label: "Úspěšné" },
            { value: "failed", label: "Zrušené / prohrané" },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {WEB_TYPE_ORDER.map((t) => (
            <FilterChip key={t} active={types.includes(t)} onClick={() => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}>
              {WEB_TYPE[t].label}
            </FilterChip>
          ))}
        </div>
        <div className="flex gap-2 lg:ml-auto">
          <Select
            label="Minimální hodnocení"
            value={minRating}
            onChange={setMinRating}
            options={[
              { value: "0", label: "Jakékoli hodnocení" },
              { value: "5", label: "★★★★★ pouze" },
              { value: "4", label: "★★★★ a více" },
              { value: "3", label: "★★★ a více" },
            ]}
          />
          <Select
            label="Řazení"
            value={sort}
            onChange={setSort}
            options={[
              { value: "date", label: "Nejnovější" },
              { value: "rating", label: "Hodnocení" },
              { value: "price", label: "Cena" },
            ]}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState title="Žádné projekty pro zvolené filtry" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((p) => {
            const won = p.status === "completed";
            const hoursVar = p.estimatedHours ? p.actualHours / p.estimatedHours - 1 : 0;
            const late = p.actualEndDate && p.actualEndDate > p.plannedEndDate;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  won ? "border-line hover:border-emerald-500/40" : "border-line hover:border-red-500/40",
                )}
              >
                <span className={cn("absolute inset-x-0 top-0 h-0.5", won ? "bg-emerald-500" : "bg-red-500/70")} />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg group-hover:text-accent">{p.name}</p>
                    <p className="truncate text-xs text-muted">
                      {clientName(p.clientId)} · {WEB_TYPE[p.type].label}
                    </p>
                  </div>
                  <ProjectStatusBadge status={p.status} short />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Stars value={p.rating} size={13} />
                  <span className="tabular text-sm font-semibold text-fg">{formatCZK(p.price)}</span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1">
                  {p.outcomeReasons.map((r) => (
                    <li
                      key={r}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]",
                        won ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "bg-red-500/10 text-red-800 dark:text-red-300",
                      )}
                    >
                      {won ? <CircleCheck size={11} /> : <CircleX size={11} />}
                      {r}
                    </li>
                  ))}
                </ul>
                {p.feedback && (
                  <p className="mt-3 line-clamp-3 text-xs text-fg-2 italic">
                    <Quote size={11} className="mr-1 inline text-muted" />
                    {p.feedback}
                  </p>
                )}
                <div className="min-h-3 flex-1" />
                {p.status !== "lost" && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[11px]">
                    <div>
                      <p className="text-muted">Čas vs. plán</p>
                      <p className={cn("tabular font-medium", hoursVar > 0.1 ? "text-red-600 dark:text-red-400" : "text-fg")}>
                        {p.actualHours} / {p.estimatedHours} h ({hoursVar > 0 ? "+" : ""}
                        {formatPercent(hoursVar)})
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Termín</p>
                      <p className={cn("font-medium", late ? "text-amber-700 dark:text-amber-400" : "text-fg")}>
                        {p.status === "cancelled" ? "Ukončeno předčasně" : late ? "Po termínu" : "Dodrženo"}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
