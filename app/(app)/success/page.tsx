import { CalendarCheck, CircleCheck, Clock, Star, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { PlanVsActualChart } from "@/components/charts/MoreCharts";
import { CaseStudies } from "@/components/projects/CaseStudies";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatNumber, formatPercent } from "@/lib/format";
import { outcomeReasons, successMetrics } from "@/lib/metrics";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Úspěšnost projektů" };

export default async function SuccessPage() {
  const { ctx } = await getData();
  const m = successMetrics(ctx.projects);
  const reasons = outcomeReasons(ctx.projects);
  const pct = (v: number | null) => (v === null ? "—" : formatPercent(v));
  const planActual = ctx.projects
    .filter((p) => p.status === "completed" && p.estimatedHours > 0)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((p) => ({ name: p.name, planned: p.estimatedHours, actual: p.actualHours }));
  const rated = ctx.projects.filter((p) => p.rating);
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: rated.filter((p) => p.rating === stars).length }));
  const maxDist = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Případové studie & Win/Loss"
        title="Úspěšnost projektů"
        description="Proč zakázky vyhráváme a proč je ztrácíme, jak dodržujeme plán a jak nás hodnotí klienti. Počítá se z uzavřených projektů."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Úspěšnost realizace" value={pct(m.successRate)} icon={<CircleCheck size={15} />} hint={`${m.completed} dokončeno · ${m.cancelled} zrušeno`} />
        <KpiCard label="Win rate nabídek" value={pct(m.winRate)} icon={<Trophy size={15} />} hint={`${m.lost} prohraných nabídek`} />
        <KpiCard label="Průměrné hodnocení" value={m.avgRating === null ? "—" : `${formatNumber(m.avgRating, 1)} / 5`} icon={<Star size={15} />} hint={`${m.ratedCount} hodnocení`} />
        <KpiCard label="Dodáno v termínu" value={pct(m.onTimeRate)} icon={<CalendarCheck size={15} />} hint="dokončené projekty" />
        <KpiCard label="V rozpočtu hodin" value={pct(m.onBudgetRate)} icon={<Clock size={15} />} hint="skutečnost ≤ odhad" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Plán vs. realita" description="Odhadované vs. skutečně odpracované hodiny u dokončených projektů" />
          <CardBody>
            {planActual.length ? (
              <PlanVsActualChart data={planActual} />
            ) : (
              <p className="rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-muted">Zobrazí se po dokončení prvního projektu s odhadem hodin.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Hodnocení klientů" description="Rozložení hvězdiček" />
          <CardBody className="space-y-2.5">
            {distribution.map((d) => (
              <div key={d.stars} className="flex items-center gap-3 text-xs">
                <span className="tabular inline-flex w-8 items-center gap-0.5 text-fg-2">
                  {d.stars} <Star size={11} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${(d.count / maxDist) * 100}%` }} />
                </div>
                <span className="tabular w-6 text-right text-muted">{d.count}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReasonCard title="Důvody úspěchu" description="Co opakovaně funguje u dokončených projektů" rows={reasons.positive} tone="good" />
        <ReasonCard title="Důvody neúspěchu" description="Zrušené projekty a prohrané nabídky" rows={reasons.negative} tone="bad" />
      </div>

      <div className="mt-8">
        <h2 className="mb-1 text-base font-semibold tracking-tight text-fg">Případové studie</h2>
        <p className="mb-4 text-sm text-fg-2">Uzavřené projekty včetně finální ceny, času realizace a zpětné vazby klienta.</p>
        <CaseStudies projects={ctx.projects} clients={ctx.clients.map((c) => ({ id: c.id, name: c.company }))} />
      </div>
    </div>
  );
}

function ReasonCard({ title, description, rows, tone }: { title: string; description: string; rows: { reason: string; count: number }[]; tone: "good" | "bad" }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-2.5">
        {rows.length === 0 && <p className="text-xs text-muted">Zatím žádná data – důvody vyplníte u uzavřeného projektu.</p>}
        {rows.map((r) => (
          <div key={r.reason} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_24px] items-center gap-3 text-xs">
            <span className="truncate text-fg-2" title={r.reason}>
              {r.reason}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-surface-3">
              <div className={tone === "good" ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-red-500"} style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
            <span className="tabular text-right font-medium text-fg">{r.count}×</span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
