"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Segmented } from "@/components/ui/controls";
import { formatCZK, formatCZKCompact, formatMonthLong, formatMonthShort } from "@/lib/format";
import type { MonthRow } from "@/lib/metrics";
import { Legend, TooltipBox, axisProps, cursorFill, gridProps, type TipProps } from "./ChartParts";

type Mode = "revenue" | "profit";

function RevenueTooltip({ active, payload, mode }: TipProps & { mode: Mode }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as MonthRow;
  const rows =
    mode === "revenue"
      ? [
          { label: "Projekty", value: formatCZK(row.project), color: "var(--series-1)" },
          { label: "Retainery (MRR)", value: formatCZK(row.retainer), color: "var(--series-2)" },
          ...(row.expenses ? [{ label: "Náklady", value: formatCZK(row.expenses), color: "var(--fg-2)" }] : []),
          { label: "Obrat celkem", value: formatCZK(row.revenue), emphasis: true },
        ]
      : [
          { label: "Obrat", value: formatCZK(row.revenue) },
          { label: "Náklady", value: formatCZK(row.expenses) },
          { label: "Provozní zisk", value: formatCZK(row.profit), emphasis: true },
        ];
  return (
    <TooltipBox
      title={formatMonthLong(row.month)}
      rows={rows}
      footer={row.revenue > 0 ? `Marže ${Math.round((row.profit / row.revenue) * 100)} %` : undefined}
    />
  );
}

/** Příjmy po měsících: projekty + retainery (stacked) a náklady jako linka na stejné ose. */
export function RevenueChart({
  data,
  height = 300,
  showToggle = true,
  showExpenses = true,
}: {
  data: MonthRow[];
  height?: number;
  showToggle?: boolean;
  showExpenses?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("revenue");
  const chartData = data.map((d) => ({
    ...d,
    label: formatMonthShort(d.month),
    profitPositive: Math.max(0, d.profit),
    profitNegative: Math.min(0, d.profit),
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {mode === "revenue" ? (
          <Legend
            items={[
              { label: "Projekty", color: "var(--series-1)" },
              { label: "Retainery", color: "var(--series-2)" },
              ...(showExpenses ? [{ label: "Náklady", color: "var(--fg-2)", kind: "line" as const }] : []),
            ]}
          />
        ) : (
          <Legend
            items={[
              { label: "Zisk", color: "var(--series-1)" },
              { label: "Ztráta", color: "var(--critical)" },
            ]}
          />
        )}
        {showToggle && (
          <Segmented
            label="Zobrazení grafu"
            value={mode}
            onChange={setMode}
            options={[
              { value: "revenue", label: "Obrat" },
              { value: "profit", label: "Zisk" },
            ]}
          />
        )}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} dy={6} />
            <YAxis {...axisProps} width={68} tickFormatter={(v: number) => formatCZKCompact(v, false)} />
            <Tooltip cursor={cursorFill} content={(props) => <RevenueTooltip {...props} mode={mode} />} />
            {mode === "revenue" ? (
              <>
                <Bar dataKey="project" stackId="r" fill="var(--series-1)" stroke="var(--surface)" strokeWidth={1} maxBarSize={24} animationDuration={700} />
                <Bar dataKey="retainer" stackId="r" fill="var(--series-2)" stroke="var(--surface)" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={24} animationDuration={700} />
                {showExpenses && <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--fg-2)"
                  strokeWidth={2}
                  strokeDasharray="0"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--fg-2)" }}
                />}
              </>
            ) : (
              <>
                <Bar dataKey="profitPositive" stackId="p" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="profitNegative" stackId="p" fill="var(--critical)" radius={[0, 0, 4, 4]} maxBarSize={24} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
