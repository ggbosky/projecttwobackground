import {
  REFERENCE_DATE,
  REFERENCE_MONTH,
  clients,
  finance,
  getMember,
  invoices,
  invoicesForProject,
  projects,
  team,
} from "./data";
import { parseDate } from "./format";
import type { Client, Project, ProjectStatus, TeamMember, WebType } from "./types";

/* ------------------------------------------------------------------ */
/* Pomocné funkce pro data a měsíce                                    */
/* ------------------------------------------------------------------ */

export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const d = parseDate(`${month}-01`);
  return monthKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1)));
}

/** Posledních `count` měsíců končících referenčním měsícem (vč.) */
export function lastMonths(count: number, end = REFERENCE_MONTH): string[] {
  return Array.from({ length: count }, (_, i) => addMonths(end, i - count + 1));
}

function monthBounds(month: string): [Date, Date] {
  const start = parseDate(`${month}-01`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  return [start, end];
}

/** Počet pracovních dní (Po–Pá) v intervalu včetně krajních dní */
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

/* ------------------------------------------------------------------ */
/* Stavy projektů                                                      */
/* ------------------------------------------------------------------ */

export const SIGNED_STATUSES: ProjectStatus[] = ["in_progress", "on_hold", "completed", "cancelled"];
export const ACTIVE_STATUSES: ProjectStatus[] = ["in_progress", "on_hold"];

export const isSigned = (p: Project) => SIGNED_STATUSES.includes(p.status);

/* ------------------------------------------------------------------ */
/* Finance projektu                                                    */
/* ------------------------------------------------------------------ */

const AVG_HOURLY_COST = team.reduce((s, m) => s + m.hourlyCost, 0) / team.length;

/** Vážená hodinová nákladová sazba týmu projektu */
export function blendedHourlyCost(project: Project): number {
  const weights = project.team.filter((a) => a.hoursPerWeek > 0);
  const totalWeight = weights.reduce((s, a) => s + a.hoursPerWeek, 0);
  if (totalWeight === 0) {
    const members = project.team.map((a) => getMember(a.memberId)).filter(Boolean) as TeamMember[];
    return members.length ? members.reduce((s, m) => s + m.hourlyCost, 0) / members.length : AVG_HOURLY_COST;
  }
  return (
    weights.reduce((s, a) => s + (getMember(a.memberId)?.hourlyCost ?? AVG_HOURLY_COST) * a.hoursPerWeek, 0) /
    totalWeight
  );
}

export interface ProjectFinancials {
  invoiced: number;
  paid: number;
  remaining: number;
  /** Příjem, se kterým počítáme (cena / vyfakturováno u zrušených) */
  revenue: number;
  /** Náklady – skutečné, u běžících projektů odhad na konci projektu */
  cost: number;
  profit: number;
  margin: number;
  /** Efektivní hodinovka = příjem / hodiny */
  effectiveRate: number;
  /** Odhad hodin na konci projektu */
  forecastHours: number;
  hoursVariance: number;
  isProjection: boolean;
  /** Skutečná vs. plánovaná délka ve dnech */
  plannedDays: number;
  actualDays?: number;
}

export function projectFinancials(project: Project): ProjectFinancials {
  const projectInvoices = invoicesForProject(project.id);
  const invoiced = projectInvoices.reduce((s, i) => s + i.amount, 0);
  const paid = projectInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const rate = blendedHourlyCost(project);

  const isProjection = project.status === "in_progress" || project.status === "on_hold" || project.status === "proposal";
  const revenue =
    project.status === "cancelled" ? invoiced : project.status === "lost" ? 0 : project.price;

  let forecastHours = project.actualHours;
  if (isProjection) {
    // Odhad dokončení: lineární extrapolace podle progresu, minimálně plán
    const byProgress = project.progress > 10 ? project.actualHours / (project.progress / 100) : 0;
    forecastHours = Math.max(project.estimatedHours, Math.round(byProgress));
  }

  const cost = forecastHours * rate + project.externalCosts;
  const profit = revenue - cost;
  const plannedDays = Math.round(
    (parseDate(project.plannedEndDate).getTime() - parseDate(project.startDate).getTime()) / 864e5,
  );
  const actualDays = project.actualEndDate
    ? Math.round((parseDate(project.actualEndDate).getTime() - parseDate(project.startDate).getTime()) / 864e5)
    : undefined;

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
  };
}

/* ------------------------------------------------------------------ */
/* Příjmy, MRR, ARR                                                    */
/* ------------------------------------------------------------------ */

export function isRetainerActive(client: Client, at: Date = REFERENCE_DATE): boolean {
  const r = client.retainer;
  if (!r) return false;
  return parseDate(r.since) <= at && (!r.until || parseDate(r.until) >= at);
}

/** Měsíční opakovaný příjem z aktivních retainerů (správa, SLA, hosting) */
export function currentMRR(at: Date = REFERENCE_DATE): number {
  return clients.filter((c) => isRetainerActive(c, at)).reduce((s, c) => s + (c.retainer?.monthly ?? 0), 0);
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

export function monthlySeries(count = 12, end = REFERENCE_MONTH): MonthRow[] {
  return lastMonths(count, end).map((month) => {
    const monthInvoices = invoices.filter((i) => i.issueDate.startsWith(month));
    const project = monthInvoices.filter((i) => i.kind === "project").reduce((s, i) => s + i.amount, 0);
    const retainer = monthInvoices.filter((i) => i.kind === "retainer").reduce((s, i) => s + i.amount, 0);
    const e = finance.expenses.find((x) => x.month === month);
    const expenses = e ? e.salaries + e.tools + e.marketing + e.office : 0;
    const [, monthEnd] = monthBounds(month);
    return {
      month,
      project,
      retainer,
      revenue: project + retainer,
      expenses,
      profit: project + retainer - expenses,
      mrr: currentMRR(monthEnd),
    };
  });
}

export function revenueInMonth(month: string): number {
  return invoices.filter((i) => i.issueDate.startsWith(month)).reduce((s, i) => s + i.amount, 0);
}

export function revenueInYear(year: string): number {
  return invoices.filter((i) => i.issueDate.startsWith(year)).reduce((s, i) => s + i.amount, 0);
}

/** Obrat za posledních 12 uzavřených měsíců */
export function trailingTwelveMonths(): number {
  const months = lastMonths(12, addMonths(REFERENCE_MONTH, -1));
  return months.reduce((s, m) => s + revenueInMonth(m), 0);
}

export function receivables() {
  const pending = invoices.filter((i) => i.status === "pending");
  const overdue = invoices.filter((i) => i.status === "overdue");
  return {
    pending: pending.reduce((s, i) => s + i.amount, 0),
    overdue: overdue.reduce((s, i) => s + i.amount, 0),
    pendingCount: pending.length,
    overdueCount: overdue.length,
  };
}

/* ------------------------------------------------------------------ */
/* Pipeline & cashflow                                                 */
/* ------------------------------------------------------------------ */

export function pipelineSummary() {
  const active = projects.filter((p) => ACTIVE_STATUSES.includes(p.status));
  const contracted = active.reduce((s, p) => s + p.price, 0);
  const invoicedActive = active.reduce((s, p) => s + projectFinancials(p).invoiced, 0);
  const proposals = projects.filter((p) => p.status === "proposal");
  const proposalValue = proposals.reduce((s, p) => s + p.price, 0);
  const weightedProposals = proposals.reduce((s, p) => s + p.price * (p.probability ?? 0), 0);
  return {
    activeCount: active.length,
    contracted,
    invoicedActive,
    toInvoice: contracted - invoicedActive,
    proposalCount: proposals.length,
    proposalValue,
    weightedProposals,
  };
}

/* ------------------------------------------------------------------ */
/* Úspěšnost                                                           */
/* ------------------------------------------------------------------ */

export function averageProjectPrice(): number {
  const won = projects.filter((p) => ["completed", "in_progress", "on_hold"].includes(p.status));
  return won.reduce((s, p) => s + p.price, 0) / Math.max(1, won.length);
}

export function successMetrics() {
  const completed = projects.filter((p) => p.status === "completed");
  const cancelled = projects.filter((p) => p.status === "cancelled");
  const lost = projects.filter((p) => p.status === "lost");
  const signed = projects.filter(isSigned);
  const rated = projects.filter((p) => typeof p.rating === "number");
  const onTime = completed.filter((p) => p.actualEndDate && p.actualEndDate <= p.plannedEndDate);
  const onBudget = completed.filter((p) => p.actualHours <= p.estimatedHours);
  return {
    completed: completed.length,
    cancelled: cancelled.length,
    lost: lost.length,
    winRate: signed.length / Math.max(1, signed.length + lost.length),
    successRate: completed.length / Math.max(1, completed.length + cancelled.length),
    avgRating: rated.reduce((s, p) => s + (p.rating ?? 0), 0) / Math.max(1, rated.length),
    ratedCount: rated.length,
    onTimeRate: onTime.length / Math.max(1, completed.length),
    onBudgetRate: onBudget.length / Math.max(1, completed.length),
  };
}

export function outcomeReasons() {
  const positive = new Map<string, number>();
  const negative = new Map<string, number>();
  for (const p of projects) {
    const bucket = p.status === "completed" ? positive : p.status === "cancelled" || p.status === "lost" ? negative : null;
    if (!bucket) continue;
    for (const r of p.outcomeReasons) bucket.set(r, (bucket.get(r) ?? 0) + 1);
  }
  const toRows = (m: Map<string, number>) =>
    [...m.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  return { positive: toRows(positive), negative: toRows(negative) };
}

/* ------------------------------------------------------------------ */
/* Typy webů                                                           */
/* ------------------------------------------------------------------ */

export function revenueByType() {
  const types: WebType[] = ["eshop", "presentation", "webflow", "custom"];
  const won = projects.filter((p) => ["completed", "in_progress", "on_hold"].includes(p.status));
  return types.map((type) => {
    const list = won.filter((p) => p.type === type);
    return { type, value: list.reduce((s, p) => s + p.price, 0), count: list.length };
  });
}

/* ------------------------------------------------------------------ */
/* Tým & kapacita                                                      */
/* ------------------------------------------------------------------ */

/** Projekty, na kterých se právě aktivně pracuje */
export function runningProjects(at: Date = REFERENCE_DATE): Project[] {
  return projects.filter(
    (p) => p.status === "in_progress" && parseDate(p.startDate) <= at && parseDate(p.plannedEndDate) >= at,
  );
}

export function memberLoad(member: TeamMember, at: Date = REFERENCE_DATE) {
  const assignments = runningProjects(at)
    .map((p) => ({ project: p, hours: p.team.find((a) => a.memberId === member.id)?.hoursPerWeek ?? 0 }))
    .filter((a) => a.hours > 0);
  const allocated = assignments.reduce((s, a) => s + a.hours, 0);
  return { assignments, allocated, utilization: allocated / member.hoursPerWeek };
}

export interface CapacityMonth {
  month: string;
  capacity: number;
  allocated: number;
  free: number;
  utilization: number;
  /** Kolik nových průměrných webů zvládneme nabrat (po odečtení vážené pipeline nabídek) */
  slots: number;
  /** Hodiny, které by spotřebovaly nabídky vážené pravděpodobností */
  pipelineDemand: number;
  members: { member: TeamMember; capacity: number; allocated: number }[];
}

/** Průměrná měsíční náročnost jednoho webu (hodiny / měsíc trvání) */
export function avgMonthlyHoursPerProject(): number {
  const done = projects.filter((p) => p.status === "completed");
  const perMonth = done.map((p) => {
    const months = Math.max(1, workdaysBetween(parseDate(p.startDate), parseDate(p.actualEndDate ?? p.plannedEndDate)) / 21);
    return p.actualHours / months;
  });
  return perMonth.reduce((s, x) => s + x, 0) / Math.max(1, perMonth.length);
}

/** Bezpečnostní rezerva kapacity na podporu, obchod a nepředvídané úkoly */
export const CAPACITY_BUFFER = 0.15;

export function capacityForMonth(month: string): CapacityMonth {
  const [mStart, mEnd] = monthBounds(month);
  // Pro aktuální měsíc počítáme jen se zbývajícími pracovními dny
  const from = month === REFERENCE_MONTH ? REFERENCE_DATE : mStart;
  const workdays = workdaysBetween(from, mEnd);
  const weeks = workdays / 5;

  const overlapWeeks = (p: Project) => {
    const s = parseDate(p.startDate);
    const e = parseDate(p.plannedEndDate);
    const a = s > from ? s : from;
    const b = e < mEnd ? e : mEnd;
    return workdaysBetween(a, b) / 5;
  };

  const inProgress = projects.filter((p) => p.status === "in_progress");
  const proposals = projects.filter((p) => p.status === "proposal");

  const members = team.map((member) => {
    const capacity = member.hoursPerWeek * weeks;
    const allocated = inProgress.reduce(
      (s, p) => s + (p.team.find((a) => a.memberId === member.id)?.hoursPerWeek ?? 0) * overlapWeeks(p),
      0,
    );
    return { member, capacity, allocated };
  });

  const capacity = members.reduce((s, m) => s + m.capacity, 0);
  const allocated = members.reduce((s, m) => s + m.allocated, 0);
  const free = Math.max(0, capacity * (1 - CAPACITY_BUFFER) - allocated);
  const pipelineDemand = proposals.reduce(
    (s, p) => s + p.team.reduce((t, a) => t + a.hoursPerWeek, 0) * overlapWeeks(p) * (p.probability ?? 0),
    0,
  );
  const perProject = avgMonthlyHoursPerProject() * (workdays / 21);

  return {
    month,
    capacity,
    allocated,
    free,
    utilization: capacity > 0 ? allocated / capacity : 0,
    slots: perProject > 0 ? Math.floor(Math.max(0, free - pipelineDemand) / perProject) : 0,
    pipelineDemand,
    members,
  };
}

/** Průměrná měsíční náročnost podle typu webu (fallback na celkový průměr) */
export function avgMonthlyHoursByType(): Record<WebType, number> {
  const overall = avgMonthlyHoursPerProject();
  const result = {} as Record<WebType, number>;
  for (const type of ["eshop", "presentation", "webflow", "custom"] as WebType[]) {
    const done = projects.filter((p) => p.status === "completed" && p.type === type);
    const values = done.map(
      (p) => p.actualHours / Math.max(1, workdaysBetween(parseDate(p.startDate), parseDate(p.actualEndDate ?? p.plannedEndDate)) / 21),
    );
    result[type] = values.length ? values.reduce((s, x) => s + x, 0) / values.length : overall;
  }
  return result;
}
