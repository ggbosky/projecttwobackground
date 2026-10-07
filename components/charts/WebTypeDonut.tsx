"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Segmented } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { formatCZK, formatCZKCompact, formatPercent } from "@/lib/format";
import { WEB_TYPE } from "@/lib/status";
import type { WebType } from "@/lib/types";
import { TooltipBox, type TipProps } from "./ChartParts";

interface Row {
  type: WebType;
  value: number;
  count: number;
}

/** Koláč (donut) podle typů webů. Legenda je zároveň tabulka hodnot – světlé odstíny tak nenesou význam samy. */
export function WebTypeDonut({ data }: { data: Row[] }) {
  const [metric, setMetric] = useState<"value" | "count">("value");
  const [hovered, setHovered] = useState<WebType | null>(null);
  const total = data.reduce((s, d) => s + d[metric], 0);
  const rows = data.map((d) => ({ ...d, metricValue: d[metric], share: total ? d[metric] / total : 0 }));
  const focus = rows.find((r) => r.type === hovered);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex justify-end">
        <Segmented
          label="Metrika"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "value", label: "Hodnota" },
            { value: "count", label: "Počet" },
          ]}
        />
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }: TipProps) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as (typeof rows)[number];
                return (
                  <TooltipBox
                    title={WEB_TYPE[r.type].label}
                    rows={[
                      { label: "Hodnota zakázek", value: formatCZK(r.value), color: WEB_TYPE[r.type].color },
                      { label: "Počet projektů", value: String(r.count) },
                      { label: "Podíl", value: formatPercent(r.share, 1), emphasis: true },
                    ]}
                  />
                );
              }}
            />
            <Pie
              data={rows}
              dataKey="metricValue"
              nameKey="type"
              innerRadius="64%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="var(--surface)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              onMouseEnter={(_, i) => setHovered(rows[i].type)}
              onMouseLeave={() => setHovered(null)}
              animationDuration={700}
            >
              {rows.map((r) => (
                <Cell key={r.type} fill={WEB_TYPE[r.type].color} opacity={hovered && hovered !== r.type ? 0.35 : 1} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] text-muted">{focus ? WEB_TYPE[focus.type].label : "Celkem"}</span>
          <span className="text-lg font-semibold tracking-tight text-fg">
            {metric === "value"
              ? formatCZKCompact(focus ? focus.value : total)
              : `${focus ? focus.count : total} webů`}
          </span>
        </div>
      </div>
      <ul className="mt-4 space-y-1">
        {rows.map((r) => (
          <li
            key={r.type}
            onMouseEnter={() => setHovered(r.type)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              hovered === r.type ? "bg-surface-2" : "",
            )}
          >
            <span className="size-2.5 rounded-[3px]" style={{ background: WEB_TYPE[r.type].color }} />
            <span className="text-fg-2">{WEB_TYPE[r.type].label}</span>
            <span className="tabular ml-auto text-muted">{r.count}×</span>
            <span className="tabular w-20 text-right font-medium text-fg">{formatCZKCompact(r.value)}</span>
            <span className="tabular w-10 text-right text-muted">{formatPercent(r.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
