import {
  ArrowRight,
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  Repeat,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Sparkline } from "@/components/charts/MoreCharts";
import { WebTypeDonut } from "@/components/charts/WebTypeDonut";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { DeployBadge, InvoiceStatusBadge, ProjectStatusBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Progress } from "@/components/ui/Progress";
import {
  REFERENCE_DATE,
  REFERENCE_MONTH,
  clientName,
  getMember,
  getMemberByGithub,
  getProject,
  invoices,
  mockRepos,
  projects,
  team,
} from "@/lib/data";
import {
  formatCZK,
  formatCZKCompact,
  formatDate,
  formatDateShort,
  formatMonthLong,
  formatNumber,
  formatPercent,
  formatRelative,
  parseDate,
} from "@/lib/format";
import {
  addMonths,
  averageProjectPrice,
  capacityForMonth,
  currentMRR,
  memberLoad,
  monthlySeries,
  pipelineSummary,
  receivables,
  revenueByType,
  revenueInMonth,
  revenueInYear,
  successMetrics,
} from "@/lib/metrics";
import type { TeamMember } from "@/lib/types";

export default function OverviewPage() {
  const series = monthlySeries(12);
  const lastMonth = addMonths(REFERENCE_MONTH, -1);
  const prevMonth = addMonths(REFERENCE_MONTH, -2);
  const lastRevenue = revenueInMonth(lastMonth);
  const prevRevenue = revenueInMonth(prevMonth);
  const year = REFERENCE_MONTH.slice(0, 4);
  const ytd = revenueInYear(year);
  const mrr = currentMRR();
  const pipeline = pipelineSummary();
  const success = successMetrics();
  const rec = receivables();
  const capNow = capacityForMonth(REFERENCE_MONTH);
  const capNext = capacityForMonth(addMonths(REFERENCE_MONTH, 1));

  const active = projects
    .filter((p) => p.status === "in_progress")
    .sort((a, b) => a.plannedEndDate.localeCompare(b.plannedEndDate));

  const commits = mockRepos
    .flatMap((r) => r.commits.map((c) => ({ ...c, repo: r.fullName.split("/")[1], projectId: r.projectId })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const openInvoices = invoices
    .filter((i) => i.status !== "paid")
    .sort((a, b) => (a.status === "overdue" ? -1 : 1) - (b.status === "overdue" ? -1 : 1) || b.amount - a.amount)
    .slice(0, 5);

  const deploys = mockRepos.filter((r) => r.deployment.state !== "none" && getProject(r.projectId)?.status === "in_progress");

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow={formatDate(REFERENCE_DATE.toISOString().slice(0, 10))}
        title="Dobré ráno, Tomáši 👋"
        description={`Běží ${active.length} projektů, v pipeline je ${pipeline.proposalCount} nabídky za ${formatCZKCompact(pipeline.proposalValue)} a ${rec.overdueCount} faktury jsou po splatnosti.`}
        actions={
          <>
            <Link
              href="/finance"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              Finanční report
            </Link>
            <Link
              href="/projects"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card transition-all hover:brightness-110"
            >
              Všechny projekty <ArrowRight size={15} />
            </Link>
          </>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Obrat · ${formatMonthLong(lastMonth)}`}
          value={formatCZK(lastRevenue)}
          icon={<Banknote size={15} />}
          delta={prevRevenue ? lastRevenue / prevRevenue - 1 : undefined}
          deltaLabel={`vs. ${formatMonthLong(prevMonth)}`}
        >
          <Sparkline id="rev" data={series as unknown as Record<string, number>[]} dataKey="revenue" />
        </KpiCard>
        <KpiCard
          label={`Obrat ${year} (YTD)`}
          value={formatCZK(ytd)}
          icon={<CircleDollarSign size={15} />}
          hint={`ARR z retainerů ${formatCZKCompact(mrr * 12)}`}
        >
          <Sparkline id="profit" data={series as unknown as Record<string, number>[]} dataKey="profit" color="var(--series-3)" reference={0} />
        </KpiCard>
        <KpiCard
          label="MRR (retainery)"
          value={formatCZK(mrr)}
          icon={<Repeat size={15} />}
          delta={series.at(-4)?.mrr ? mrr / (series.at(-4)?.mrr ?? 1) - 1 : undefined}
          deltaLabel="za 3 měsíce"
        >
          <Sparkline id="mrr" data={series as unknown as Record<string, number>[]} dataKey="mrr" color="var(--series-2)" />
        </KpiCard>
        <KpiCard
          label="Pipeline (rozpracováno)"
          value={formatCZK(pipeline.toInvoice)}
          icon={<Target size={15} />}
          hint={`zbývá vyfakturovat z ${formatCZKCompact(pipeline.contracted)}`}
        >
          <div className="mt-3.5 space-y-1.5">
            <Progress value={pipeline.invoicedActive} max={pipeline.contracted} label="Vyfakturováno z rozpracovaných zakázek" />
            <p className="text-[11px] text-muted">
              Vyfakturováno {formatPercent(pipeline.invoicedActive / pipeline.contracted)} · nabídky váženě{" "}
              {formatCZKCompact(pipeline.weightedProposals)}
            </p>
          </div>
        </KpiCard>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={<CircleDollarSign size={14} />} label="Průměrná cena webu" value={formatCZKCompact(averageProjectPrice())} />
        <MiniStat icon={<Trophy size={14} />} label="Win rate nabídek" value={formatPercent(success.winRate)} />
        <MiniStat
          icon={<Star size={14} />}
          label="Hodnocení klientů"
          value={`${formatNumber(success.avgRating, 1)} / 5`}
        />
        <MiniStat
          icon={<Gauge size={14} />}
          label="Volné sloty (tento / příští měs.)"
          value={`${capNow.slots} / ${capNext.slots} weby`}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Příjmy po měsících" description="Vystavené faktury – projekty a retainery vs. provozní náklady (posledních 12 měsíců)" />
          <CardBody>
            <RevenueChart data={series} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Zakázky podle typu webu" description="Podepsané projekty (dokončené i běžící)" />
          <CardBody>
            <WebTypeDonut data={revenueByType()} />
          </CardBody>
        </Card>
      </div>

      {/* Active projects + activity */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Rozpracované projekty"
            description="Seřazeno podle termínu dokončení"
            action={
              <Link href="/projects?status=in_progress" className="text-xs font-medium text-accent hover:underline">
                Zobrazit vše
              </Link>
            }
          />
          <div className="divide-y divide-line border-t border-line">
            {active.map((p) => {
              const members = p.team.map((a) => getMember(a.memberId)).filter(Boolean) as TeamMember[];
              const daysLeft = Math.round((parseDate(p.plannedEndDate).getTime() - REFERENCE_DATE.getTime()) / 864e5);
              const timeElapsed =
                (REFERENCE_DATE.getTime() - parseDate(p.startDate).getTime()) /
                (parseDate(p.plannedEndDate).getTime() - parseDate(p.startDate).getTime());
              const behind = p.progress / 100 < timeElapsed - 0.1;
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group grid grid-cols-1 gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/60 sm:grid-cols-[1fr_180px_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-fg group-hover:text-accent">{p.name}</p>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {clientName(p.clientId)} · {formatCZK(p.price)}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="tabular text-fg-2">{p.progress} %</span>
                      <span className={behind ? "font-medium text-amber-700 dark:text-amber-400" : "text-muted"}>
                        {behind ? "Ve skluzu · " : ""}
                        {daysLeft >= 0 ? `${daysLeft} dní` : "po termínu"}
                      </span>
                    </div>
                    <Progress value={p.progress} max={100} tone={behind ? "warn" : "accent"} label={`Postup ${p.name}`} />
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                      <CalendarClock size={12} /> {formatDateShort(p.plannedEndDate)}
                    </span>
                    <AvatarStack members={members} max={3} size="xs" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Poslední aktivita na GitHubu"
            icon={<GithubIcon size={15} />}
            action={
              <Link href="/github" className="text-xs font-medium text-accent hover:underline">
                GitHub
              </Link>
            }
          />
          <CardBody className="space-y-3.5">
            {commits.map((c) => {
              const member = getMemberByGithub(c.author);
              return (
                <div key={c.sha} className="flex gap-3">
                  <Avatar name={member?.name ?? c.author} color={member?.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-fg">{c.message}</p>
                    <p className="truncate text-[11px] text-muted">
                      {c.repo} · <span className="font-mono">{c.sha.slice(0, 7)}</span> · {formatRelative(c.date)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-[11px] font-medium text-muted">Nasazení běžících projektů</p>
              <div className="flex flex-wrap gap-1.5">
                {deploys.map((r) => (
                  <Link key={r.fullName} href={`/projects/${r.projectId}`} className="transition-opacity hover:opacity-80">
                    <DeployBadge state={r.deployment.state} provider={r.fullName.split("/")[1]} />
                  </Link>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Team + invoices */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Vytížení týmu"
            description="Alokované hodiny / týdenní kapacita"
            action={
              <Link href="/team" className="text-xs font-medium text-accent hover:underline">
                Kapacitní plánovač
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {team.map((m) => {
              const load = memberLoad(m);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.name} color={m.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs font-medium text-fg">{m.name}</span>
                      <span className="tabular shrink-0 text-[11px] text-muted">
                        {load.allocated} / {m.hoursPerWeek} h · {formatPercent(load.utilization)}
                      </span>
                    </div>
                    <Progress value={load.allocated} max={m.hoursPerWeek} tone="auto" label={`Vytížení ${m.name}`} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Otevřené faktury"
            description={`${formatCZK(rec.pending + rec.overdue)} čeká na úhradu · z toho ${formatCZK(rec.overdue)} po splatnosti`}
            action={
              <Link href="/finance#faktury" className="text-xs font-medium text-accent hover:underline">
                Všechny faktury
              </Link>
            }
          />
          <div className="divide-y divide-line border-t border-line">
            {openInvoices.map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg">{clientName(i.clientId)}</p>
                  <p className="truncate text-xs text-muted">
                    {i.number} · {i.label} · splatnost {formatDateShort(i.dueDate)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="tabular text-sm font-medium text-fg">{formatCZK(i.amount)}</span>
                  <InvoiceStatusBadge status={i.status} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-line px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {projects
                .filter((p) => p.status === "on_hold")
                .map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-2 text-xs text-fg-2 hover:text-fg">
                    <ProjectStatusBadge status={p.status} />
                    {p.name}
                  </Link>
                ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
      <span className="rounded-md bg-accent-soft p-1.5 text-accent">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-muted">{label}</p>
        <p className="tabular truncate text-sm font-semibold text-fg">{value}</p>
      </div>
    </div>
  );
}
