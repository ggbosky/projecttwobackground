import { isoDate, parseDate } from "./format";
import type { Client, DataContext, Invoice, InvoiceStatus, Project, ProjectStatus, PublicUser, WebType } from "./types";

/**
 * Všechny výpočty KPI. Funkce jsou čisté – dostanou data (`DataContext`)
 * a vrátí výsledek. Nic se nikam neodesílá.
 */

/* ------------------------------------------------------------------ */
/* Měsíce a pracovní dny                                               */
/* ------------------------------------------------------------------ */

export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const d = parseDate(`${month}-01`);
  return monthKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1)));
}

export function lastMonths(count: number, end: string): string[] {
  return Array.from({ length: count }, (_, i) => addMonths(end, i - count + 1));
}

function monthBounds(month: string): [Date, Date] {
  const start = parseDate(`${month}-01`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  return [start, end];
}

export function workdaysBetween(from: Date, to: Date): number {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  let count = 0;
  while (d <= end) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

export const currentMonth = (ctx: DataContext) => monthKey(ctx.today);

/* ------------------------------------------------------------------ */
/* Lookupy                                                             */
/* ------------------------------------------------------------------ */

export function clientName(ctx: DataContext, id: string): string {
  return ctx.clients.find((c) => c.id === id)?.company ?? "Smazaný klient";
}

export function memberById(ctx: DataContext, id: string): PublicUser | undefined {
  return ctx.users.find((u) => u.id === id);
}

export function invoiceStatus(inv: Invoice, today: Date): InvoiceStatus {
  if (inv.paid) return "paid";
  return inv.dueDate < isoDate(today) ? "overdue" : "pending";
}

export const SIGNED: ProjectStatus[] = ["in_progress", "on_hold", "completed", "cancelled"];
export const WON: ProjectStatus[] = ["in_progress", "on_hold", "completed"];

/* ------------------------------------------------------------------ */
/* Finance projektu                                                    */
/* ------------------------------------------------------------------ */

export function blendedHourlyCost(ctx: DataContext, project: Project): number {
  const fallback = ctx.users.length ? ctx.users.reduce((s, u) => s + u.hourlyCost, 0) / ctx.users.length : 0;
  const weights = project.team.filter((a) => a.hoursPerWeek > 0);
  const total = weights.reduce((s, a) => s + a.hoursPerWeek, 0);
  if (total === 0) {
    const members = project.team.map((a) => memberById(ctx, a.memberId)).filter(Boolean) as PublicUser[];
    return members.length ? members.reduce((s, m) => s + m.hourlyCost, 0) / members.length : fallback;
  }
  return weights.reduce((s, a) => s + (memberById(ctx, a.memberId)?.hourlyCost ?? fallback) * a.hoursPerWeek, 0) / total;
}

export interface ProjectFinancials {
  invoiced: number;
  paid: number;
  remaining: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  effectiveRate: number;
  forecastHours: number;
  hoursVariance: number;
  isProjection: boolean;
  plannedDays: number;
  actualDays?: number;
  rate: number;
}

export function projectFinancials(ctx: DataContext, project: Project): ProjectFinancials {
  const invs = ctx.invoices.filter((i) => i.projectId === project.id);
  const invoiced = invs.reduce((s, i) => s + i.amount, 0);
  const paid = invs.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0);
  const rate = blendedHourlyCost(ctx, project);
  const isProjection = ["in_progress", "on_hold", "proposal"].includes(project.status);
  const revenue = project.status === "cancelled" ? invoiced : project.status === "lost" ? 0 : project.price;

  let forecastHours = project.actualHours;
  if (isProjection) {
    const byProgress = project.progress > 10 ? project.actualHours / (project.progress / 100) : 0;
    forecastHours = Math.max(project.estimatedHours, Math.round(byProgress), project.actualHours);
  }
  const cost = forecastHours * rate + project.externalCosts;
  const profit = revenue - cost;
  const span = (a: string, b: string) => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 864e5);
  const plannedDays = project.startDate && project.plannedEndDate ? span(project.startDate, project.plannedEndDate) : 0;
  const actualDays = project.startDate && project.actualEndDate ? span(project.startDate, project.actualEndDate) : undefined;

  return {
    invoiced,
    paid,
    remaining: Math.max(0, (project.status === "cancelled" ? invoiced : project.price) - invoiced),
    revenue,
    cost,
    profit,
    margin: revenue > 0 ? profit / revenue : 0,
    effectiveRate: forecastHours > 0 ? revenue / forecastHours : 0,
    forecastHours,
    hoursVariance: project.estimatedHours > 0 ? forecastHours / project.estimatedHours - 1 : 0,
    isProjection,
    plannedDays,
    actualDays,
    rate,
  };
}

/* ------------------------------------------------------------------ */
/* Příjmy, MRR, ARR                                                    */
/* ------------------------------------------------------------------ */

export function isRetainerActive(client: Client, at: Date): boolean {
  const r = client.retainer;
  if (!r || !r.monthly || !r.since) return false;
  const day = isoDate(at);
  return r.since <= day && (!r.until || r.until >= day);
}

export function currentMRR(ctx: DataContext, at: Date = ctx.today): number {
  return ctx.clients.filter((c) => isRetainerActive(c, at)).reduce((s, c) => s + (c.retainer?.monthly ?? 0), 0);
}

export interface MonthRow {
  month: string;
  project: number;
  retainer: number;
  revenue: number;
  expenses: number;
  profit: number;
  mrr: number;
}

export function monthlySeries(ctx: DataContext, count = 12, invoices: Invoice[] = ctx.invoices, withExpenses = true): MonthRow[] {
  return lastMonths(count, currentMonth(ctx)).map((month) => {
    const inMonth = invoices.filter((i) => i.issueDate.startsWith(month));
    const retainer = inMonth.filter((i) => i.kind === "retainer").reduce((s, i) => s + i.amount, 0);
    const project = inMonth.filter((i) => i.kind !== "retainer").reduce((s, i) => s + i.amount, 0);
    const expenses = withExpenses
      ? ctx.expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0)
      : 0;
    const [, end] = monthBounds(month);
    return {
      month,
      project,
      retainer,
      revenue: project + retainer,
      expenses,
      profit: project + retainer - expenses,
      mrr: currentMRR(ctx, end < ctx.today ? end : ctx.today),
    };
  });
}

export function revenueIn(ctx: DataContext, prefix: string): number {
  return ctx.invoices.filter((i) => i.issueDate.startsWith(prefix)).reduce((s, i) => s + i.amount, 0);
}

export function receivables(ctx: DataContext) {
  const open = ctx.invoices.filter((i) => !i.paid);
  const overdue = open.filter((i) => invoiceStatus(i, ctx.today) === "overdue");
  const pending = open.filter((i) => invoiceStatus(i, ctx.today) === "pending");
  return {
    pending: pending.reduce((s, i) => s + i.amount, 0),
    overdue: overdue.reduce((s, i) => s + i.amount, 0),
    pendingCount: pending.length,
    overdueCount: overdue.length,
  };
}

/* ------------------------------------------------------------------ */
/* Pipeline & úspěšnost                                                */
/* ------------------------------------------------------------------ */

export function pipelineSummary(ctx: DataContext) {
  const active = ctx.projects.filter((p) => p.status === "in_progress" || p.status === "on_hold");
  const contracted = active.reduce((s, p) => s + p.price, 0);
  const invoicedActive = active.reduce((s, p) => s + projectFinancials(ctx, p).invoiced, 0);
  const proposals = ctx.projects.filter((p) => p.status === "proposal");
  return {
    activeCount: active.length,
    contracted,
    invoicedActive,
    toInvoice: Math.max(0, contracted - invoicedActive),
    proposalCount: proposals.length,
    proposalValue: proposals.reduce((s, p) => s + p.price, 0),
    weightedProposals: proposals.reduce((s, p) => s + p.price * p.probability, 0),
  };
}

export function averageProjectPrice(ctx: DataContext): number {
  const won = ctx.projects.filter((p) => WON.includes(p.status));
  return won.length ? won.reduce((s, p) => s + p.price, 0) / won.length : 0;
}

export function successMetrics(projects: Project[]) {
  const completed = projects.filter((p) => p.status === "completed");
  const cancelled = projects.filter((p) => p.status === "cancelled");
  const lost = projects.filter((p) => p.status === "lost");
  const signed = projects.filter((p) => SIGNED.includes(p.status));
  const rated = projects.filter((p) => typeof p.rating === "number" && p.rating > 0);
  const onTime = completed.filter((p) => p.actualEndDate && p.plannedEndDate && p.actualEndDate <= p.plannedEndDate);
  const onBudget = completed.filter((p) => p.estimatedHours > 0 && p.actualHours <= p.estimatedHours);
  const ratio = (a: number, b: number) => (b > 0 ? a / b : null);
  return {
    completed: completed.length,
    cancelled: cancelled.length,
    lost: lost.length,
    winRate: ratio(signed.length, signed.length + lost.length),
    successRate: ratio(completed.length, completed.length + cancelled.length),
    avgRating: rated.length ? rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length : null,
    ratedCount: rated.length,
    onTimeRate: ratio(onTime.length, completed.length),
    onBudgetRate: ratio(onBudget.length, completed.filter((p) => p.estimatedHours > 0).length),
  };
}

export function outcomeReasons(projects: Project[]) {
  const positive = new Map<string, number>();
  const negative = new Map<string, number>();
  for (const p of projects) {
    const bucket = p.status === "completed" ? positive : p.status === "cancelled" || p.status === "lost" ? negative : null;
    if (!bucket) continue;
    for (const r of p.outcomeReasons) bucket.set(r, (bucket.get(r) ?? 0) + 1);
  }
  const rows = (m: Map<string, number>) =>
    [...m.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  return { positive: rows(positive), negative: rows(negative) };
}

export function revenueByType(ctx: DataContext) {
  const types: WebType[] = ["eshop", "presentation", "webflow", "custom"];
  const won = ctx.projects.filter((p) => WON.includes(p.status));
  return types.map((type) => {
    const list = won.filter((p) => p.type === type);
    return { type, value: list.reduce((s, p) => s + p.price, 0), count: list.length };
  });
}

/* ------------------------------------------------------------------ */
/* Tým & kapacita                                                      */
/* ------------------------------------------------------------------ */

export function runningProjects(ctx: DataContext): Project[] {
  const day = isoDate(ctx.today);
  return ctx.projects.filter(
    (p) => p.status === "in_progress" && (!p.startDate || p.startDate <= day) && (!p.plannedEndDate || p.plannedEndDate >= day),
  );
}

export function memberLoad(ctx: DataContext, member: PublicUser) {
  const assignments = runningProjects(ctx)
    .map((project) => ({ project, hours: project.team.find((a) => a.memberId === member.id)?.hoursPerWeek ?? 0 }))
    .filter((a) => a.hours > 0);
  const allocated = assignments.reduce((s, a) => s + a.hours, 0);
  return { assignments, allocated, utilization: member.hoursPerWeek > 0 ? allocated / member.hoursPerWeek : 0 };
}

export function avgMonthlyHoursPerProject(ctx: DataContext, type?: WebType): number | null {
  const done = ctx.projects.filter(
    (p) => p.status === "completed" && p.actualHours > 0 && p.startDate && (p.actualEndDate || p.plannedEndDate) && (!type || p.type === type),
  );
  if (!done.length) return null;
  const values = done.map(
    (p) => p.actualHours / Math.max(1, workdaysBetween(parseDate(p.startDate), parseDate(p.actualEndDate || p.plannedEndDate)) / 21),
  );
  return values.reduce((s, x) => s + x, 0) / values.length;
}

/** Výchozí odhad, dokud nemáte dokončené projekty (h / měsíc na jeden web) */
export const DEFAULT_MONTHLY_HOURS = 80;

export function avgMonthlyHoursByType(ctx: DataContext): Record<WebType, number> {
  const overall = avgMonthlyHoursPerProject(ctx) ?? DEFAULT_MONTHLY_HOURS;
  const result = {} as Record<WebType, number>;
  for (const t of ["eshop", "presentation", "webflow", "custom"] as WebType[]) {
    result[t] = avgMonthlyHoursPerProject(ctx, t) ?? overall;
  }
  return result;
}

export interface CapacityMonth {
  month: string;
  capacity: number;
  allocated: number;
  free: number;
  buffer: number;
  utilization: number;
  slots: number;
  pipelineDemand: number;
}

export function capacityForMonth(ctx: DataContext, month: string): CapacityMonth {
  const [mStart, mEnd] = monthBounds(month);
  const from = month === currentMonth(ctx) ? ctx.today : mStart;
  const workdays = workdaysBetween(from, mEnd);
  const weeks = workdays / 5;

  const overlapWeeks = (p: Project) => {
    const s = p.startDate ? parseDate(p.startDate) : from;
    const e = p.plannedEndDate ? parseDate(p.plannedEndDate) : mEnd;
    const a = s > from ? s : from;
    const b = e < mEnd ? e : mEnd;
    return workdaysBetween(a, b) / 5;
  };

  const inProgress = ctx.projects.filter((p) => p.status === "in_progress");
  const proposals = ctx.projects.filter((p) => p.status === "proposal");

  const capacity = ctx.users.reduce((s, u) => s + u.hoursPerWeek * weeks, 0);
  const allocated = inProgress.reduce((s, p) => s + p.team.reduce((t, a) => t + a.hoursPerWeek, 0) * overlapWeeks(p), 0);
  const buffer = capacity * ctx.settings.capacityBuffer;
  const free = Math.max(0, capacity - buffer - allocated);
  const pipelineDemand = proposals.reduce(
    (s, p) => s + p.team.reduce((t, a) => t + a.hoursPerWeek, 0) * overlapWeeks(p) * p.probability,
    0,
  );
  const perProject = (avgMonthlyHoursPerProject(ctx) ?? DEFAULT_MONTHLY_HOURS) * (workdays / 21);

  return {
    month,
    capacity,
    allocated,
    free,
    buffer: Math.min(buffer, Math.max(0, capacity - allocated)),
    utilization: capacity > 0 ? allocated / capacity : 0,
    slots: perProject > 0 ? Math.floor(Math.max(0, free - pipelineDemand) / perProject) : 0,
    pipelineDemand,
  };
}
