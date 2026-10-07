import {
  Banknote,
  CalendarClock,
  Check,
  CircleAlert,
  CircleDollarSign,
  Gauge,
  ListTodo,
  Plus,
  Repeat,
  Star,
  Target,
  TriangleAlert,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkline } from "@/components/charts/MoreCharts";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Progress } from "@/components/ui/Progress";
import { analyzeClient } from "@/lib/analysis";
import { cn } from "@/lib/cn";
import { formatCZK, formatCZKCompact, formatDate, formatDateShort, formatMonthLong, formatNumber, formatPercent, formatRelative, isoDate, parseDate } from "@/lib/format";
import {
  addMonths,
  averageProjectPrice,
  capacityForMonth,
  clientName,
  currentMonth,
  currentMRR,
  invoiceStatus,
  memberLoad,
  monthlySeries,
  pipelineSummary,
  receivables,
  revenueIn,
  successMetrics,
} from "@/lib/metrics";
import { getData } from "@/lib/server/auth";
import { COMM_TYPE } from "@/lib/status";
import type { PublicUser } from "@/lib/types";

export default async function OverviewPage() {
  const { me, ctx } = await getData();
  const today = isoDate(ctx.today);
  const month = currentMonth(ctx);
  const lastMonth = addMonths(month, -1);
  const series = monthlySeries(ctx, 12);
  const mrr = currentMRR(ctx);
  const pipeline = pipelineSummary(ctx);
  const success = successMetrics(ctx.projects);
  const rec = receivables(ctx);
  const capNow = capacityForMonth(ctx, month);
  const capNext = capacityForMonth(ctx, addMonths(month, 1));
  const last = revenueIn(ctx, lastMonth);
  const prev = revenueIn(ctx, addMonths(month, -2));

  const empty = ctx.clients.length === 0;
  const setup = [
    { done: ctx.users.length > 1, label: "Přidejte účty pro kolegy", href: "/team" },
    { done: ctx.users.every((u) => u.hourlyCost > 0), label: "Nastavte nákladové sazby (pro ziskovost)", href: "/settings" },
    { done: ctx.clients.length > 0, label: "Přidejte prvního klienta nebo lead", href: "/clients/new" },
    { done: ctx.projects.length > 0, label: "Založte projekt nebo nabídku", href: "/projects/new" },
    { done: ctx.invoices.length > 0, label: "Zaznamenejte první fakturu", href: "/finance#faktury" },
    { done: ctx.settings.targetMonthlyRevenue > 0, label: "Nastavte měsíční cíl obratu", href: "/settings" },
  ];
  const setupDone = setup.filter((s) => s.done).length;

  // Moje úkoly napříč klienty
  const myTasks = ctx.clients
    .flatMap((c) => c.tasks.filter((t) => !t.done && t.assigneeId === me.id).map((t) => ({ ...t, client: c })))
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
    .slice(0, 8);

  // Vyžaduje pozornost
  const attention = [
    ...ctx.invoices
      .filter((i) => invoiceStatus(i, ctx.today) === "overdue")
      .map((i) => ({
        level: "critical" as const,
        text: `Faktura ${i.number} po splatnosti (${formatCZK(i.amount)})`,
        sub: clientName(ctx, i.clientId),
        href: `/clients/${i.clientId}#prace`,
      })),
    ...ctx.clients.flatMap((c) =>
      analyzeClient(ctx, c)
        .flags.filter((f) => f.level === "warning" && !f.text.startsWith("Faktur"))
        .map((f) => ({ level: "warning" as const, text: f.text, sub: c.company, href: `/clients/${c.id}` })),
    ),
  ].slice(0, 8);

  const active = ctx.projects
    .filter((p) => p.status === "in_progress")
    .sort((a, b) => (a.plannedEndDate || "9999").localeCompare(b.plannedEndDate || "9999"));

  const recent = ctx.clients
    .flatMap((c) => c.communication.map((e) => ({ ...e, client: c })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const pct = (v: number | null) => (v === null ? "—" : formatPercent(v));

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow={formatDate(today)}
        title="Přehled"
        actions={
          <>
            <Link href="/projects/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg hover:border-line-strong hover:bg-surface-2">
              <Plus size={15} /> Projekt
            </Link>
            <Link href="/clients/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110">
              <Plus size={15} /> Klient
            </Link>
          </>
        }
      />

      {setupDone < setup.length && (
        <Card className="mb-4">
          <CardHeader
            title="Rozjezd Project Two"
            description={`${setupDone} z ${setup.length} kroků hotovo`}
            action={<span className="tabular text-xs text-muted">{Math.round((setupDone / setup.length) * 100)} %</span>}
          />
          <CardBody>
            <Progress value={setupDone} max={setup.length} className="mb-4" />
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {setup.map((s) => (
                <li key={s.label}>
                  <Link
                    href={s.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      s.done ? "border-line text-muted line-through" : "border-line bg-surface-2/40 text-fg hover:border-accent/40",
                    )}
                  >
                    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-line-strong")}>
                      {s.done && <Check size={12} />}
                    </span>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Obrat · ${formatMonthLong(lastMonth)}`}
          value={formatCZK(last)}
          icon={<Banknote size={15} />}
          delta={prev ? last / prev - 1 : undefined}
          deltaLabel={prev ? "vs. předchozí měsíc" : `tento měsíc ${formatCZKCompact(revenueIn(ctx, month))}`}
        >
          {series.some((s) => s.revenue > 0) && <Sparkline id="rev" data={series as unknown as Record<string, number>[]} dataKey="revenue" />}
        </KpiCard>
        <KpiCard label="MRR (retainery)" value={formatCZK(mrr)} icon={<Repeat size={15} />} hint={`ARR ${formatCZKCompact(mrr * 12)}`}>
          {mrr > 0 && <Sparkline id="mrr" data={series as unknown as Record<string, number>[]} dataKey="mrr" color="var(--series-2)" />}
        </KpiCard>
        <KpiCard label="Pipeline (zbývá vyfakturovat)" value={formatCZK(pipeline.toInvoice)} icon={<Target size={15} />} hint={`z ${formatCZKCompact(pipeline.contracted)} nasmlouváno`}>
          {pipeline.contracted > 0 && (
            <div className="mt-3.5">
              <Progress value={pipeline.invoicedActive} max={pipeline.contracted} label="Vyfakturováno" />
            </div>
          )}
        </KpiCard>
        <KpiCard
          label="Pohledávky"
          value={formatCZK(rec.pending + rec.overdue)}
          icon={<CircleDollarSign size={15} />}
          hint={<span className={rec.overdue ? "text-red-600 dark:text-red-400" : undefined}>{formatCZKCompact(rec.overdue)} po splatnosti</span>}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={<CircleDollarSign size={14} />} label="Průměrná cena webu" value={formatCZKCompact(averageProjectPrice(ctx))} />
        <MiniStat icon={<Trophy size={14} />} label="Win rate nabídek" value={pct(success.winRate)} />
        <MiniStat icon={<Star size={14} />} label="Hodnocení klientů" value={success.avgRating === null ? "—" : `${formatNumber(success.avgRating, 1)} / 5`} />
        <MiniStat icon={<Gauge size={14} />} label="Volné sloty (tento / příští měs.)" value={ctx.users.length ? `${capNow.slots} / ${capNext.slots} weby` : "—"} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Vyžaduje pozornost" icon={<TriangleAlert size={15} />} description={attention.length ? `${attention.length} položek` : undefined} />
          <CardBody>
            {attention.length === 0 ? (
              <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">Nic nehoří. 👌</p>
            ) : (
              <ul className="space-y-1.5">
                {attention.map((a, i) => (
                  <li key={i}>
                    <Link
                      href={a.href}
                      className={cn(
                        "flex items-start gap-2 rounded-lg px-3 py-2 text-xs transition-opacity hover:opacity-80",
                        a.level === "critical" ? "bg-red-500/10 text-red-800 dark:text-red-300" : "bg-amber-500/10 text-amber-900 dark:text-amber-300",
                      )}
                    >
                      {a.level === "critical" ? <CircleAlert size={14} className="mt-px shrink-0" /> : <TriangleAlert size={14} className="mt-px shrink-0" />}
                      <span>
                        {a.text}
                        <span className="block opacity-70">{a.sub}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Moje úkoly" icon={<ListTodo size={15} />} description="Přiřazené tobě napříč klienty" />
          <CardBody>
            {myTasks.length === 0 ? (
              <p className="text-xs text-muted">Žádné otevřené úkoly. Úkoly se zakládají v detailu klienta.</p>
            ) : (
              <ul className="divide-y divide-line">
                {myTasks.map((t) => {
                  const overdue = t.dueDate && t.dueDate < today;
                  return (
                    <li key={t.id}>
                      <Link href={`/clients/${t.client.id}#aktivita`} className="block py-2 hover:opacity-80">
                        <p className="text-sm text-fg">{t.title}</p>
                        <p className="text-[11px] text-muted">
                          {t.client.company}
                          {t.dueDate && (
                            <span className={cn("ml-1.5", overdue && "font-medium text-red-600 dark:text-red-400")}>
                              · {formatDate(t.dueDate)}
                              {overdue && " (po termínu)"}
                            </span>
                          )}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Poslední komunikace" description="Napříč všemi klienty" />
          <CardBody>
            {recent.length === 0 ? (
              <p className="text-xs text-muted">Zatím žádné záznamy.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((e) => {
                  const author = ctx.users.find((u) => u.id === e.authorId);
                  return (
                    <li key={e.id} className="flex gap-3">
                      <Avatar name={author?.name ?? "?"} color={author?.color} size="sm" />
                      <Link href={`/clients/${e.client.id}#aktivita`} className="min-w-0 flex-1 hover:opacity-80">
                        <p className="truncate text-xs text-fg">
                          <span className="font-medium">{e.client.company}</span> · {COMM_TYPE[e.type]}
                        </p>
                        <p className="line-clamp-2 text-xs text-fg-2">{e.summary}</p>
                        <p className="text-[11px] text-muted">{formatRelative(e.date, ctx.today)}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Příjmy po měsících" description="Vystavené faktury vs. náklady (posledních 12 měsíců)" />
          <CardBody>
            {empty || !series.some((s) => s.revenue > 0 || s.expenses > 0) ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
                Graf se naplní po zaznamenání první faktury.
              </p>
            ) : (
              <RevenueChart data={series} showExpenses={ctx.expenses.length > 0} />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Vytížení týmu"
            description="Alokované hodiny / týdenní kapacita"
            action={
              <Link href="/team" className="text-xs font-medium text-accent hover:underline">
                Plánovač
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {ctx.users.map((m: PublicUser) => {
              const load = memberLoad(ctx, m);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.name} color={m.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs font-medium text-fg">{m.name}</span>
                      <span className="tabular shrink-0 text-[11px] text-muted">
                        {load.allocated} / {m.hoursPerWeek} h
                      </span>
                    </div>
                    <Progress value={load.allocated} max={m.hoursPerWeek || 1} tone="auto" label={`Vytížení ${m.name}`} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Rozpracované projekty"
          description="Seřazeno podle termínu"
          action={
            <Link href="/projects?status=in_progress" className="text-xs font-medium text-accent hover:underline">
              Všechny projekty
            </Link>
          }
        />
        {active.length === 0 ? (
          <p className="px-5 pb-5 text-xs text-muted">Žádné běžící projekty.</p>
        ) : (
          <div className="divide-y divide-line border-t border-line">
            {active.map((p) => {
              const members = p.team.map((a) => ctx.users.find((u) => u.id === a.memberId)).filter(Boolean) as PublicUser[];
              const daysLeft = p.plannedEndDate ? Math.round((parseDate(p.plannedEndDate).getTime() - ctx.today.getTime()) / 864e5) : null;
              const timeElapsed =
                p.startDate && p.plannedEndDate
                  ? (ctx.today.getTime() - parseDate(p.startDate).getTime()) / Math.max(1, parseDate(p.plannedEndDate).getTime() - parseDate(p.startDate).getTime())
                  : 0;
              const behind = p.progress / 100 < timeElapsed - 0.1;
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group grid grid-cols-1 gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/60 sm:grid-cols-[1fr_200px_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg group-hover:text-accent">{p.name}</p>
                    <p className="truncate text-xs text-muted">
                      {clientName(ctx, p.clientId)} · {formatCZK(p.price)}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="tabular text-fg-2">{p.progress} %</span>
                      <span className={behind ? "font-medium text-amber-700 dark:text-amber-400" : "text-muted"}>
                        {behind ? "Ve skluzu · " : ""}
                        {daysLeft === null ? "bez termínu" : daysLeft >= 0 ? `${daysLeft} dní` : "po termínu"}
                      </span>
                    </div>
                    <Progress value={p.progress} max={100} tone={behind ? "warn" : "accent"} />
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    {p.plannedEndDate && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                        <CalendarClock size={12} /> {formatDateShort(p.plannedEndDate)}
                      </span>
                    )}
                    {members.length > 0 && <AvatarStack members={members} max={3} size="xs" />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
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
