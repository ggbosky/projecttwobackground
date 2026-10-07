"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCZK, formatCZKCompact, formatPercent } from "@/lib/format";
import { Legend, TooltipBox, axisProps, cursorFill, type TipProps } from "./ChartParts";

export interface PipelineRow {
  id: string;
  name: string;
  client: string;
  invoiced: number;
  remaining: number;
  price: number;
}

/** Rozpracované zakázky: vyfakturováno vs. zbývá vyfakturovat (horizontální stacked bar). */
export function PipelineChart({ data }: { data: PipelineRow[] }) {
  const rows = data.map((d) => ({ ...d, short: d.name.length > 22 ? `${d.name.slice(0, 21)}…` : d.name }));
  return (
    <div>
      <Legend
        className="mb-3"
        items={[
          { label: "Vyfakturováno", color: "var(--series-1)" },
          { label: "Zbývá vyfakturovat", color: "var(--series-neutral)" },
        ]}
      />
      <div style={{ height: Math.max(180, rows.length * 42 + 30) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke="var(--grid)" horizontal={false} />
            <XAxis type="number" {...axisProps} tickFormatter={(v: number) => formatCZKCompact(v, false)} />
            <YAxis type="category" dataKey="short" {...axisProps} width={160} tick={{ fill: "var(--fg-2)", fontSize: 11 }} />
            <Tooltip
              cursor={cursorFill}
              content={({ active, payload }: TipProps) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as PipelineRow;
                return (
                  <TooltipBox
                    title={r.name}
                    rows={[
                      { label: "Vyfakturováno", value: formatCZK(r.invoiced), color: "var(--series-1)" },
                      { label: "Zbývá", value: formatCZK(r.remaining), color: "var(--series-neutral)" },
                      { label: "Hodnota zakázky", value: formatCZK(r.price), emphasis: true },
                    ]}
                    footer={`${r.client} · vyfakturováno ${formatPercent(r.invoiced / r.price)}`}
                  />
                );
              }}
            />
            <Bar dataKey="invoiced" stackId="a" fill="var(--series-1)" stroke="var(--surface)" strokeWidth={1} maxBarSize={20} />
            <Bar dataKey="remaining" stackId="a" fill="var(--series-neutral)" radius={[0, 4, 4, 0]} stroke="var(--surface)" strokeWidth={1} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
