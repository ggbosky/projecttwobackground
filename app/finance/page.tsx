import { Banknote, CalendarRange, CircleDollarSign, HandCoins, Percent, Repeat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PipelineChart } from "@/components/charts/PipelineChart";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { WebTypeDonut } from "@/components/charts/WebTypeDonut";
import { InvoicesTable } from "@/components/finance/InvoicesTable";
import { ProfitabilityTable, type ProfitRow } from "@/components/finance/ProfitabilityTable";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Progress } from "@/components/ui/Progress";
import { REFERENCE_MONTH, clientName, clients, finance, invoices, projects } from "@/lib/data";
import { formatCZK, formatCZKCompact, formatDate, formatMonthLong, formatPercent } from "@/lib/format";
import {
  addMonths,
  averageProjectPrice,
  currentMRR,
  isRetainerActive,
  monthlySeries,
  pipelineSummary,
  projectFinancials,
  receivables,
  revenueByType,
  revenueInMonth,
  revenueInYear,
  trailingTwelveMonths,
} from "@/lib/metrics";

export const metadata: Metadata = { title: "Finance & KPI" };

export default function FinancePage() {
  const series = monthlySeries(12);
  const year = REFERENCE_MONTH.slice(0, 4);
  const lastMonth = addMonths(REFERENCE_MONTH, -1);
  const mtd = revenueInMonth(REFERENCE_MONTH);
  const last = revenueInMonth(lastMonth);
  const prevYearSameMonth = revenueInMonth(addMonths(lastMonth, -12));
  const ytd = revenueInYear(year);
  const ttm = trailingTwelveMonths();
  const mrr = currentMRR();
  const pipeline = pipelineSummary();
  const rec = receivables();
  const series12 = series.slice(0, 12);
  const revenue12 = series12.reduce((s, m) => s + m.revenue, 0);
  const profit12 = series12.reduce((s, m) => s + m.profit, 0);

  const profitRows: ProfitRow[] = projects
    .filter((p) => ["completed", "in_progress", "on_hold", "cancelled"].includes(p.status))
    .map((p) => {
      const f = projectFinancials(p);
      return {
        id: p.id,
        name: p.name,
        client: clientName(p.clientId),
        type: p.type,
        status: p.status,
        revenue: f.revenue,
        cost: Math.round(f.cost),
        profit: Math.round(f.profit),
        margin: f.margin,
        effectiveRate: f.effectiveRate,
        estimatedHours: p.estimatedHours,
        forecastHours: f.forecastHours,
        isProjection: f.isProjection,
      };
    });

  const pipelineRows = projects
    .filter((p) => p.status === "in_progress" || p.status === "on_hold")
    .map((p) => {
      const f = projectFinancials(p);
      return { id: p.id, name: p.name, client: clientName(p.clientId), invoiced: f.invoiced, remaining: p.price - f.invoiced, price: p.price };
    })
    .sort((a, b) => b.price - a.price);

  const proposals = projects.filter((p) => p.status === "proposal");
  const retainers = clients.filter((c) => isRetainerActive(c)).sort((a, b) => (b.retainer?.monthly ?? 0) - (a.retainer?.monthly ?? 0));

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Finanční analýza"
        title="Finance & KPI"
        description="Obrat, opakované příjmy, cashflow a ziskovost jednotlivých zakázek. Částky bez DPH."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label={`Obrat · ${formatMonthLong(lastMonth)}`}
          value={formatCZKCompact(last)}
          icon={<Banknote size={15} />}
          delta={prevYearSameMonth ? last / prevYearSameMonth - 1 : undefined}
          deltaLabel={prevYearSameMonth ? "YoY" : undefined}
          hint={`tento měsíc zatím ${formatCZKCompact(mtd)}`}
        />
        <KpiCard
          label={`Obrat ${year} (YTD)`}
          value={formatCZKCompact(ytd)}
          icon={<CalendarRange size={15} />}
          hint={`posledních 12 měs. ${formatCZKCompact(ttm)}`}
        />
        <KpiCard
          label="MRR / ARR"
          value={formatCZKCompact(mrr)}
          icon={<Repeat size={15} />}
          hint={`ARR ${formatCZKCompact(mrr * 12)} · ${retainers.length} retainerů`}
        />
        <KpiCard
          label="Průměrná cena projektu"
          value={formatCZKCompact(averageProjectPrice())}
          icon={<CircleDollarSign size={15} />}
          hint="podepsané zakázky"
        />
        <KpiCard
          label="Provozní marže (12 M)"
          value={formatPercent(profit12 / revenue12, 1)}
          icon={<Percent size={15} />}
          delta={profit12 / revenue12 - finance.targets.margin}
          deltaLabel={`vs. cíl ${formatPercent(finance.targets.margin)}`}
        />
        <KpiCard
          label="Pohledávky"
          value={formatCZKCompact(rec.pending + rec.overdue)}
          icon={<HandCoins size={15} />}
          hint={
            <span className={rec.overdue ? "text-red-600 dark:text-red-400" : undefined}>
              {formatCZKCompact(rec.overdue)} po splatnosti ({rec.overdueCount})
            </span>
          }
        />
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Příjmy a náklady po měsících"
          description={`Měsíční cíl obratu ${formatCZK(finance.targets.monthlyRevenue)} · ${series.filter((m) => m.revenue >= finance.targets.monthlyRevenue).length} z 12 měsíců nad cílem`}
        />
        <CardBody>
          <RevenueChart data={series} height={320} />
        </CardBody>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Pipeline & Cashflow" description="Rozpracované zakázky v CZK vs. reálně vyfakturováno" />
          <CardBody>
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Nasmlouváno (běží)" value={formatCZKCompact(pipeline.contracted)} />
              <Stat label="Vyfakturováno" value={formatCZKCompact(pipeline.invoicedActive)} />
              <Stat label="Zbývá vyfakturovat" value={formatCZKCompact(pipeline.toInvoice)} accent />
              <Stat label="Nabídky (vážené)" value={formatCZKCompact(pipeline.weightedProposals)} sub={`z ${formatCZKCompact(pipeline.proposalValue)}`} />
            </div>
            <PipelineChart data={pipelineRows} />
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 text-xs font-medium text-muted">Otevřené nabídky</p>
              <div className="space-y-2.5">
                {proposals.map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="group flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-fg-2 group-hover:text-fg">
                      {p.name} <span className="text-muted">· {clientName(p.clientId)}</span>
                    </span>
                    <div className="hidden w-28 sm:block">
                      <Progress value={p.probability ?? 0} label="Pravděpodobnost" />
                    </div>
                    <span className="tabular w-10 text-right text-xs text-muted">{formatPercent(p.probability ?? 0)}</span>
                    <span className="tabular w-24 text-right font-medium text-fg">{formatCZKCompact(p.price)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Obrat podle typu webu" description="Hodnota podepsaných zakázek" />
            <CardBody>
              <WebTypeDonut data={revenueByType()} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Opakované příjmy (MRR)" description={`${formatCZK(mrr)} měsíčně · ARR ${formatCZK(mrr * 12)}`} />
            <div className="divide-y divide-line border-t border-line">
              {retainers.map((c) => (
                <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-2/60">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{c.company}</p>
                    <p className="truncate text-xs text-muted">{c.retainer?.scope}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-medium text-fg">{formatCZK(c.retainer?.monthly ?? 0)}</p>
                    <p className="text-[11px] text-muted">od {formatDate(c.retainer?.since ?? "")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Profitabilita projektů"
          description="Příjmy vs. náklady na čas a externí služby. U běžících projektů projekce podle aktuálního postupu."
        />
        <ProfitabilityTable rows={profitRows} targetMargin={finance.targets.margin} />
      </Card>

      <Card className="mt-4 scroll-mt-20" id="faktury">
        <CardHeader title="Faktury" description="Vystavené faktury – filtrování podle stavu, typu, data a klienta" />
        <InvoicesTable invoices={invoices} />
      </Card>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/50 px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={accent ? "text-base font-semibold text-accent" : "text-base font-semibold text-fg"}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}
