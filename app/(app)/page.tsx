import {
  Banknote,
  CalendarClock,
  Check,
  CircleAlert,
  CircleDollarSign,
  Clock,
  Gauge,
  ListTodo,
  Plus,
  Repeat,
  Star,
  Target,
  TriangleAlert,
  Trophy,
  Users,
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
import { formatCZK, formatCZKCompact, formatDate, formatDateShort, formatMonthLong, formatNumber, formatPercent, formatRelative, isoDate, parseDate, plural } from "@/lib/format";
import {
  addMonths,
  averageProjectPrice,
  capacityForMonth,
  clientName,
  currentMonth,
  currentMRR,
  invoiceStatus,
  isRetainerActive,
  memberLoad,
  monthlySeries,
  pipelineSummary,
  receivables,
  revenueIn,
  successMetrics,
} from "@/lib/metrics";
import { getData } from "@/lib/server/context";
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
  const thisMonth = revenueIn(ctx, month);
  const year = month.slice(0, 4);
  const yearRevenue = revenueIn(ctx, year);
  const monthsThisYear = Number(month.slice(5, 7));
  const prevYearSoFar = ctx.invoices
    .filter((i) => i.issueDate.startsWith(String(Number(year) - 1)) && i.issueDate.slice(5, 10) <= today.slice(5, 10))
    .reduce((s, i) => s + i.amount, 0);
  // Procenta jen tam, kde dávají smysl (ne +4 000 % z malého základu)
  const change = (now: number, before: number) => (before > 0 && Math.abs(now / before - 1) <= 5 ? now / before - 1 : undefined);
  const monthDelta = change(thisMonth, last);
  const yearDelta = change(yearRevenue, prevYearSoFar);
  const totalRevenue = ctx.invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = ctx.invoices.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0);
  const olderRevenue = totalRevenue - series.reduce((s, r) => s + r.revenue, 0);
  let running = olderRevenue;
  const cumulative = series.map((r) => ({ cumulative: (running += r.revenue) }));
  const retainerClients = ctx.clients.filter((c) => isRetainerActive(c, ctx.today)).length;
  const activeClients = ctx.clients.filter((c) => c.status === "active").length;
  const completed = ctx.projects.filter((p) => p.status === "completed");
  const completedValue = completed.reduce((s, p) => s + p.price, 0);
  const withHours = completed.filter((p) => p.actualHours > 0);
  const hoursTotal = withHours.reduce((s, p) => s + p.actualHours, 0);
  const hourly = hoursTotal > 0 ? Math.round(withHours.reduce((s, p) => s + p.price, 0) / hoursTotal) : null;

  const empty = ctx.clients.length === 0;
  const setup = [
    { done: ctx.users.length > 0, label: "Přidejte sebe a kolegy do týmu", href: "/team" },
    { done: ctx.clients.some((c) => c.tags.includes("Reference na webu")), label: "Načtěte reference z projectwo.com", href: "/agency" },
    { done: ctx.users.length > 0 && ctx.users.every((u) => u.hourlyCost > 0), label: "Nastavte nákladové sazby (pro ziskovost)", href: "/team" },
    { done: ctx.clients.length > 0, label: "Přidejte hotové klienty (co jsme dělali a kolik jsme dostali)", href: "/clients/new" },
    { done: ctx.projects.length > 0, label: "Založte projekt nebo nabídku", href: "/projects/new" },
    { done: ctx.invoices.length > 0, label: "Zaznamenejte první fakturu", href: "/finance#faktury" },
    { done: ctx.settings.targetMonthlyRevenue > 0, label: "Nastavte měsíční cíl obratu", href: "/settings" },
  ];
  const setupDone = setup.filter((s) => s.done).length;

  // Moje úkoly napříč klienty
  const myTasks = ctx.clients
    .flatMap((c) => c.tasks.filter((t) => !t.done && (!me || t.assigneeId === me.id)).map((t) => ({ ...t, client: c })))
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
          label="Obrat celkem"
          value={formatCZK(totalRevenue)}
          icon={<Banknote size={15} />}
          hint={`zaplaceno ${formatCZKCompact(totalPaid)} · ${plural(ctx.invoices.length, "platba", "platby", "plateb")}`}
        >
          {totalRevenue > 0 && <Sparkline id="cum" data={cumulative} dataKey="cumulative" />}
        </KpiCard>
        <KpiCard
          label={`Obrat · ${formatMonthLong(month)}`}
          value={formatCZK(thisMonth)}
          icon={<CalendarClock size={15} />}
          delta={monthDelta}
          deltaLabel={monthDelta !== undefined ? `vs. ${formatMonthLong(lastMonth)}` : `${formatMonthLong(lastMonth)}: ${formatCZKCompact(last)}`}
        >
          {series.some((s) => s.revenue > 0) && <Sparkline id="rev" data={series as unknown as Record<string, number>[]} dataKey="revenue" color="var(--series-3)" />}
        </KpiCard>
        <KpiCard
          label={`Obrat · rok ${year}`}
          value={formatCZK(yearRevenue)}
          icon={<Target size={15} />}
          delta={yearDelta}
          deltaLabel={yearDelta !== undefined ? "vs. stejné období loni" : `průměr ${formatCZKCompact(yearRevenue / monthsThisYear)} / měsíc`}
        />
        <KpiCard label="MRR (měsíční paušály)" value={formatCZK(mrr)} icon={<Repeat size={15} />} hint={`ARR ${formatCZKCompact(mrr * 12)} · ${plural(retainerClients, "klient", "klienti", "klientů")}`}>
          {mrr > 0 && <Sparkline id="mrr" data={series as unknown as Record<string, number>[]} dataKey="mrr" color="var(--series-2)" />}
        </KpiCard>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat
          icon={<CircleDollarSign size={14} />}
          label={rec.overdue ? `Čeká na zaplacení · ${formatCZKCompact(rec.overdue)} po splatnosti` : "Čeká na zaplacení"}
          value={formatCZK(rec.pending + rec.overdue)}
          tone={rec.overdue ? "bad" : undefined}
          href="/finance#faktury"
        />
        <MiniStat icon={<Check size={14} />} label="Hotové zakázky" value={`${completed.length} · ${formatCZKCompact(completedValue)}`} href="/projects" />
        <MiniStat icon={<Users size={14} />} label="Klienti (aktivní / celkem)" value={`${activeClients} / ${ctx.clients.length}`} href="/clients" />
        <MiniStat icon={<CircleDollarSign size={14} />} label="Průměrná cena webu" value={formatCZKCompact(averageProjectPrice(ctx))} />
        <MiniStat icon={<Star size={14} />} label="Hodnocení klientů" value={success.avgRating === null ? "—" : `${formatNumber(success.avgRating, 1)} / 5`} href="/success" />
        <MiniStat icon={<Clock size={14} />} label="Výdělek na hodinu" value={hourly === null ? "— (zadejte hodiny)" : `${formatCZK(hourly)} / h`} />
        <MiniStat
          icon={<Trophy size={14} />}
          label="Rozpracováno + nabídky"
          value={`${formatCZKCompact(pipeline.toInvoice)} + ${formatCZKCompact(pipeline.proposalValue)}`}
          href="/projects"
        />
        <MiniStat icon={<Gauge size={14} />} label="Volné sloty (tento / příští měs.)" value={ctx.users.length ? `${capNow.slots} / ${capNext.slots} weby` : "—"} href="/team" />
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
          <CardHeader title={me ? "Moje úkoly" : "Otevřené úkoly"} icon={<ListTodo size={15} />} description={me ? `Přiřazené: ${me.name}` : "Napříč klienty"} />
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

function MiniStat({ icon, label, value, href, tone }: { icon: ReactNode; label: string; value: string; href?: string; tone?: "bad" }) {
  const body = (
    <>
      <span className={cn("rounded-md p-1.5", tone === "bad" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-accent-soft text-accent")}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-muted">{label}</p>
        <p className={cn("tabular truncate text-sm font-semibold", tone === "bad" ? "text-red-600 dark:text-red-400" : "text-fg")}>{value}</p>
      </div>
    </>
  );
  const cls = "flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-card";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-line-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
