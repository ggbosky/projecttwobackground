import { Banknote, CalendarRange, CircleDollarSign, HandCoins, Percent, Repeat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PipelineChart } from "@/components/charts/PipelineChart";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { WebTypeDonut } from "@/components/charts/WebTypeDonut";
import { Expenses } from "@/components/finance/Expenses";
import { InvoiceForm } from "@/components/finance/InvoiceForm";
import { InvoicesTable } from "@/components/finance/InvoicesTable";
import { ProfitabilityTable, type ProfitRow } from "@/components/finance/ProfitabilityTable";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Progress } from "@/components/ui/Progress";
import { formatCZK, formatCZKCompact, formatDate, formatMonthLong, formatPercent, isoDate } from "@/lib/format";
import {
  addMonths,
  averageProjectPrice,
  clientName,
  currentMonth,
  currentMRR,
  isRetainerActive,
  monthlySeries,
  pipelineSummary,
  projectFinancials,
  receivables,
  revenueByType,
  revenueIn,
} from "@/lib/metrics";
import { invoiceRows } from "@/lib/rows";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Finance" };

export default async function FinancePage() {
  const { ctx } = await getData();
  const month = currentMonth(ctx);
  const year = month.slice(0, 4);
  const lastMonth = addMonths(month, -1);
  const series = monthlySeries(ctx, 12);
  const mtd = revenueIn(ctx, month);
  const last = revenueIn(ctx, lastMonth);
  const prev = revenueIn(ctx, addMonths(month, -2));
  const ytd = revenueIn(ctx, year);
  const mrr = currentMRR(ctx);
  const pipeline = pipelineSummary(ctx);
  const rec = receivables(ctx);
  const revenue12 = series.reduce((s, m) => s + m.revenue, 0);
  const profit12 = series.reduce((s, m) => s + m.profit, 0);
  const hasExpenses = ctx.expenses.length > 0;
  const margin12 = revenue12 > 0 && hasExpenses ? profit12 / revenue12 : null;
  const today = isoDate(ctx.today);

  const profitRows: ProfitRow[] = ctx.projects
    .filter((p) => ["completed", "in_progress", "on_hold", "cancelled"].includes(p.status))
    .map((p) => {
      const f = projectFinancials(ctx, p);
      return {
        id: p.id,
        name: p.name,
        client: clientName(ctx, p.clientId),
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

  const pipelineRows = ctx.projects
    .filter((p) => (p.status === "in_progress" || p.status === "on_hold") && p.price > 0)
    .map((p) => {
      const f = projectFinancials(ctx, p);
      return { id: p.id, name: p.name, client: clientName(ctx, p.clientId), invoiced: f.invoiced, remaining: Math.max(0, p.price - f.invoiced), price: p.price };
    })
    .sort((a, b) => b.price - a.price);

  const proposals = ctx.projects.filter((p) => p.status === "proposal");
  const retainers = ctx.clients.filter((c) => isRetainerActive(c, ctx.today)).sort((a, b) => (b.retainer?.monthly ?? 0) - (a.retainer?.monthly ?? 0));
  const byType = revenueByType(ctx);
  const hasInvoices = ctx.invoices.length > 0;

  return (
    <div className="animate-in">
      <PageHeader eyebrow="Finanční analýza" title="Finance" description="Obrat, opakované příjmy, cashflow, náklady a ziskovost zakázek. Částky bez DPH." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label={`Obrat · ${formatMonthLong(lastMonth)}`}
          value={formatCZKCompact(last)}
          icon={<Banknote size={15} />}
          delta={prev ? last / prev - 1 : undefined}
          deltaLabel={prev ? "vs. předchozí měsíc" : undefined}
          hint={`tento měsíc ${formatCZKCompact(mtd)}`}
        />
        <KpiCard label={`Obrat ${year}`} value={formatCZKCompact(ytd)} icon={<CalendarRange size={15} />} hint={`12 měsíců ${formatCZKCompact(revenue12)}`} />
        <KpiCard label="MRR / ARR" value={formatCZKCompact(mrr)} icon={<Repeat size={15} />} hint={`ARR ${formatCZKCompact(mrr * 12)} · ${retainers.length} retainerů`} />
        <KpiCard label="Průměrná cena projektu" value={formatCZKCompact(averageProjectPrice(ctx))} icon={<CircleDollarSign size={15} />} hint="podepsané zakázky" />
        <KpiCard
          label="Provozní marže (12 M)"
          value={margin12 === null ? "—" : formatPercent(margin12, 1)}
          icon={<Percent size={15} />}
          delta={margin12 === null ? undefined : margin12 - ctx.settings.targetMargin}
          deltaLabel={margin12 === null ? "zadejte náklady" : `vs. cíl ${formatPercent(ctx.settings.targetMargin)}`}
        />
        <KpiCard
          label="Pohledávky"
          value={formatCZKCompact(rec.pending + rec.overdue)}
          icon={<HandCoins size={15} />}
          hint={<span className={rec.overdue ? "text-red-600 dark:text-red-400" : undefined}>{formatCZKCompact(rec.overdue)} po splatnosti ({rec.overdueCount})</span>}
        />
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Příjmy a náklady po měsících"
          description={
            ctx.settings.targetMonthlyRevenue
              ? `Měsíční cíl ${formatCZK(ctx.settings.targetMonthlyRevenue)} · ${series.filter((m) => m.revenue >= ctx.settings.targetMonthlyRevenue).length} z 12 měsíců nad cílem`
              : "Měsíční cíl obratu nastavíte v Nastavení"
          }
        />
        <CardBody>
          {hasInvoices || hasExpenses ? (
            <RevenueChart data={series} height={300} showExpenses={hasExpenses} />
          ) : (
            <p className="rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-muted">Graf se naplní po vystavení první faktury nebo zadání nákladu.</p>
          )}
        </CardBody>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Pipeline & Cashflow" description="Rozpracované zakázky vs. reálně vyfakturováno" />
          <CardBody>
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Nasmlouváno (běží)" value={formatCZKCompact(pipeline.contracted)} />
              <Stat label="Vyfakturováno" value={formatCZKCompact(pipeline.invoicedActive)} />
              <Stat label="Zbývá vyfakturovat" value={formatCZKCompact(pipeline.toInvoice)} accent />
              <Stat label="Nabídky (vážené)" value={formatCZKCompact(pipeline.weightedProposals)} sub={`z ${formatCZKCompact(pipeline.proposalValue)}`} />
            </div>
            {pipelineRows.length ? (
              <PipelineChart data={pipelineRows} />
            ) : (
              <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-xs text-muted">Žádné rozpracované zakázky s cenou.</p>
            )}
            {proposals.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="mb-2 text-xs font-medium text-muted">Otevřené nabídky</p>
                <div className="space-y-2.5">
                  {proposals.map((p) => (
                    <Link key={p.id} href={`/projects/${p.id}`} className="group flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate text-fg-2 group-hover:text-fg">
                        {p.name} <span className="text-muted">· {clientName(ctx, p.clientId)}</span>
                      </span>
                      <div className="hidden w-28 sm:block">
                        <Progress value={p.probability} label="Pravděpodobnost" />
                      </div>
                      <span className="tabular w-10 text-right text-xs text-muted">{formatPercent(p.probability)}</span>
                      <span className="tabular w-24 text-right font-medium text-fg">{formatCZKCompact(p.price)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Obrat podle typu webu" description="Hodnota podepsaných zakázek" />
            <CardBody>
              {byType.some((t) => t.count > 0) ? (
                <WebTypeDonut data={byType} />
              ) : (
                <p className="py-8 text-center text-xs text-muted">Zatím žádné podepsané zakázky.</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Opakované příjmy (MRR)" description={`${formatCZK(mrr)} měsíčně · ARR ${formatCZK(mrr * 12)}`} />
            {retainers.length === 0 ? (
              <p className="px-5 pb-5 text-xs text-muted">Žádné aktivní retainery. Nastavíte je v profilu klienta (sekce Fakturace).</p>
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {retainers.map((c) => (
                  <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-2/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-fg">{c.company}</p>
                      <p className="truncate text-xs text-muted">{c.retainer?.scope}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-sm font-medium text-fg">{formatCZK(c.retainer?.monthly ?? 0)}</p>
                      {c.retainer?.since && <p className="text-[11px] text-muted">od {formatDate(c.retainer.since)}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Profitabilita projektů" description="Příjmy vs. náklady na čas a externí služby. U běžících projektů projekce podle postupu." />
        {profitRows.length ? (
          <ProfitabilityTable rows={profitRows} targetMargin={ctx.settings.targetMargin} />
        ) : (
          <p className="px-5 pb-5 text-xs text-muted">Profitabilita se počítá pro podepsané projekty.</p>
        )}
      </Card>

      <Card className="mt-4 scroll-mt-20" id="faktury">
        <CardHeader title="Faktury" description="Vystavené faktury – stav se počítá podle splatnosti" />
        <div className="px-5 pb-4">
          <InvoiceForm
            clients={ctx.clients.map((c) => ({ id: c.id, name: c.company }))}
            projects={ctx.projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId }))}
            today={today}
          />
        </div>
        <InvoicesTable invoices={invoiceRows(ctx)} />
      </Card>

      <Card className="mt-4 scroll-mt-20" id="naklady">
        <CardHeader title="Náklady" description="Provozní náklady agentury – vstupují do grafu zisku a provozní marže" />
        <Expenses expenses={ctx.expenses} today={today} />
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
