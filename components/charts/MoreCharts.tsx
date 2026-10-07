"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatHours, formatMonthLong, formatPercent } from "@/lib/format";
import { Legend, TooltipBox, axisProps, cursorFill, gridProps, type TipProps } from "./ChartParts";

/* ------------------------------------------------------------------ */
/* Plán vs. realita (hodiny)                                           */
/* ------------------------------------------------------------------ */

export interface PlanActualRow {
  name: string;
  planned: number;
  actual: number;
}

export function PlanVsActualChart({ data, height = 280 }: { data: PlanActualRow[]; height?: number }) {
  const rows = data.map((d) => ({ ...d, short: d.name.split(" ").slice(0, 2).join(" ") }));
  return (
    <div>
      <Legend
        className="mb-3"
        items={[
          { label: "Plán (h)", color: "var(--series-neutral)" },
          { label: "Skutečnost (h)", color: "var(--series-1)" },
        ]}
      />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barGap={2} barCategoryGap="24%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="short" {...axisProps} interval={0} angle={-25} textAnchor="end" height={56} />
            <YAxis {...axisProps} width={44} />
            <Tooltip
              cursor={cursorFill}
              content={({ active, payload }: TipProps) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as PlanActualRow;
                const diff = r.actual / r.planned - 1;
                return (
                  <TooltipBox
                    title={r.name}
                    rows={[
                      { label: "Plán", value: formatHours(r.planned), color: "var(--series-neutral)" },
                      { label: "Skutečnost", value: formatHours(r.actual), color: "var(--series-1)" },
                      { label: "Odchylka", value: `${diff > 0 ? "+" : ""}${formatPercent(diff, 1)}`, emphasis: true },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="planned" fill="var(--series-neutral)" radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="actual" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kapacita týmu po měsících                                           */
/* ------------------------------------------------------------------ */

export interface CapacityRow {
  month: string;
  label: string;
  allocated: number;
  free: number;
  buffer: number;
  capacity: number;
  pipeline: number;
}

export function CapacityChart({ data, height = 260 }: { data: CapacityRow[]; height?: number }) {
  return (
    <div>
      <Legend
        className="mb-3"
        items={[
          { label: "Alokováno na projekty", color: "var(--series-1)" },
          { label: "Volná kapacita", color: "var(--series-3)" },
          { label: "Rezerva", color: "var(--series-neutral)" },
        ]}
      />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="34%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} dy={6} />
            <YAxis {...axisProps} width={56} tickFormatter={(v: number) => `${v} h`} />
            <Tooltip
              cursor={cursorFill}
              content={({ active, payload }: TipProps) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as CapacityRow;
                return (
                  <TooltipBox
                    title={formatMonthLong(r.month)}
                    rows={[
                      { label: "Alokováno", value: formatHours(r.allocated), color: "var(--series-1)" },
                      { label: "Volno", value: formatHours(r.free), color: "var(--series-3)" },
                      { label: "Rezerva", value: formatHours(r.buffer), color: "var(--series-neutral)" },
                      { label: "Pipeline (vážená)", value: formatHours(r.pipeline) },
                      { label: "Kapacita týmu", value: formatHours(r.capacity), emphasis: true },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="allocated" stackId="c" fill="var(--series-1)" stroke="var(--surface)" strokeWidth={1} maxBarSize={36} />
            <Bar dataKey="free" stackId="c" fill="var(--series-3)" stroke="var(--surface)" strokeWidth={1} maxBarSize={36} />
            <Bar dataKey="buffer" stackId="c" fill="var(--series-neutral)" radius={[4, 4, 0, 0]} stroke="var(--surface)" strokeWidth={1} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

export function Sparkline({
  data,
  dataKey,
  height = 40,
  color = "var(--series-1)",
  id,
  reference,
}: {
  data: Record<string, number | string>[];
  dataKey: string;
  height?: number;
  color?: string;
  id: string;
  reference?: number;
}) {
  return (
    <div style={{ height }} className="mt-3 -mx-1" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {reference !== undefined && <ReferenceLine y={reference} stroke="var(--axis)" strokeDasharray="3 3" />}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
