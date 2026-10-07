import { daysAgo, daysBetween, formatCZK, formatPercent, isoDate, plural } from "./format";
import {
  averageProjectPrice,
  currentMRR,
  invoiceStatus,
  isRetainerActive,
  monthlySeries,
  projectFinancials,
  successMetrics,
  WON,
  type MonthRow,
} from "./metrics";
import type { Client, CommunicationType, DataContext, ProjectStatus } from "./types";

/**
 * Hloubková analýza jednoho klienta – finance, platební morálka, projekty,
 * komunikace, zdraví vztahu, scoring leadu, rizika a doporučené kroky.
 * Vše se počítá z vašich vlastních dat, nic se neodesílá ven.
 */

export interface Factor {
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface Flag {
  level: "critical" | "warning" | "info";
  text: string;
}

export interface ClientAnalysis {
  finance: {
    invoiced: number;
    paid: number;
    outstanding: number;
    overdue: number;
    overdueCount: number;
    invoiceCount: number;
    avgDaysToPay: number | null;
    avgDelay: number | null;
    latePayments: number;
    mrr: number;
    shareOfRevenue: number | null;
    revenue12m: number;
    series: MonthRow[];
    firstInvoice: string | null;
    lastInvoice: string | null;
    potentialValue: number;
  };
  projects: {
    total: number;
    byStatus: Record<ProjectStatus, number>;
    totalValue: number;
    avgValue: number | null;
    totalHours: number;
    effectiveRate: number | null;
    avgMargin: number | null;
    profit: number;
    successRate: number | null;
    winRate: number | null;
    avgRating: number | null;
    onTimeRate: number | null;
    hoursOverrun: number | null;
  };
  engagement: {
    lastContact: string | null;
    daysSinceContact: number | null;
    contacts90d: number;
    byType: Record<CommunicationType, number>;
    openTasks: number;
    overdueTasks: number;
    nextTask: { title: string; dueDate: string } | null;
    relationshipDays: number | null;
  };
  completeness: { score: number; missing: string[] };
  health: { score: number; label: string; tone: "green" | "blue" | "amber" | "red"; factors: Factor[] } | null;
  lead: { score: number; grade: "Hot" | "Warm" | "Cold"; factors: Factor[]; recommendation: string } | null;
  flags: Flag[];
  recommendations: string[];
}

const TIMELINE_POINTS: Record<string, number> = { asap: 20, "1-3m": 16, "3-6m": 10, "6m+": 5, "": 6 };

export function analyzeClient(ctx: DataContext, client: Client): ClientAnalysis {
  const today = ctx.today;
  const day = isoDate(today);
  const invoices = ctx.invoices.filter((i) => i.clientId === client.id);
  const projects = ctx.projects.filter((p) => p.clientId === client.id);

  /* ---------------- Finance ---------------- */
  const invoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const paidInv = invoices.filter((i) => i.paid);
  const paid = paidInv.reduce((s, i) => s + i.amount, 0);
  const overdueInv = invoices.filter((i) => invoiceStatus(i, today) === "overdue");
  const withPayDate = paidInv.filter((i) => i.paidDate);
  const avgDaysToPay = withPayDate.length
    ? withPayDate.reduce((s, i) => s + daysBetween(i.issueDate, i.paidDate), 0) / withPayDate.length
    : null;
  const avgDelay = withPayDate.length
    ? withPayDate.reduce((s, i) => s + Math.max(0, daysBetween(i.dueDate, i.paidDate)), 0) / withPayDate.length
    : null;
  const latePayments = withPayDate.filter((i) => i.paidDate > i.dueDate).length;
  const series = monthlySeries(ctx, 12, invoices, false);
  const revenue12m = series.reduce((s, m) => s + m.revenue, 0);
  const agency12m = monthlySeries(ctx, 12, ctx.invoices, false).reduce((s, m) => s + m.revenue, 0);
  const sortedDates = invoices.map((i) => i.issueDate).sort();
  const mrr = isRetainerActive(client, today) ? (client.retainer?.monthly ?? 0) : 0;
  const openProposals = projects.filter((p) => p.status === "proposal");
  const potentialValue = openProposals.reduce((s, p) => s + p.price * p.probability, 0);

  /* ---------------- Projekty ---------------- */
  const byStatus = { proposal: 0, in_progress: 0, on_hold: 0, completed: 0, cancelled: 0, lost: 0 } as Record<ProjectStatus, number>;
  projects.forEach((p) => byStatus[p.status]++);
  const won = projects.filter((p) => WON.includes(p.status));
  const fin = projects.filter((p) => p.status !== "lost" && p.status !== "proposal").map((p) => ({ p, f: projectFinancials(ctx, p) }));
  const totalHours = projects.reduce((s, p) => s + p.actualHours, 0);
  const realized = fin.filter((x) => x.f.revenue > 0);
  const realizedRevenue = realized.reduce((s, x) => s + x.f.revenue, 0);
  // Bez nákladových sazeb by marže vycházela nesmyslně 100 %
  const costsKnown = ctx.users.some((u) => u.hourlyCost > 0) || realized.some((x) => x.p.externalCosts > 0);
  const profit = realized.reduce((s, x) => s + x.f.profit, 0);
  const sm = successMetrics(projects);
  const doneWithEstimate = projects.filter((p) => p.status === "completed" && p.estimatedHours > 0);
  const hoursOverrun = doneWithEstimate.length
    ? doneWithEstimate.reduce((s, p) => s + p.actualHours, 0) / doneWithEstimate.reduce((s, p) => s + p.estimatedHours, 0) - 1
    : null;

  /* ---------------- Komunikace ---------------- */
  const comms = [...client.communication].sort((a, b) => b.date.localeCompare(a.date));
  const lastContact = comms[0]?.date ?? null;
  const daysSinceContact = lastContact ? Math.max(0, daysBetween(lastContact.slice(0, 10), day)) : null;
  const byType = { email: 0, call: 0, meeting: 0, note: 0 } as Record<CommunicationType, number>;
  comms.forEach((c) => byType[c.type]++);
  const contacts90d = comms.filter((c) => c.type !== "note" && daysBetween(c.date.slice(0, 10), day) <= 90).length;
  const openTasks = client.tasks.filter((t) => !t.done);
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < day);
  const nextTask = [...openTasks].filter((t) => t.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? openTasks[0];
  const relationshipDays = client.since ? Math.max(0, daysBetween(client.since, day)) : null;

  /* ---------------- Úplnost profilu ---------------- */
  const checks: [boolean, string][] = [
    [client.contacts.length > 0, "kontaktní osoba"],
    [client.contacts.some((c) => c.email || c.phone), "e-mail nebo telefon kontaktu"],
    [client.contacts.some((c) => c.isDecisionMaker), "rozhodovatel"],
    [!!client.industry, "odvětví"],
    [!!client.ico, "IČO"],
    [!!client.city, "město"],
    [!!client.website, "web"],
    [!!client.size, "velikost firmy"],
    [!!(client.qualification.needs || client.qualification.painPoints), "potřeby / bolesti"],
    [client.qualification.budgetMax !== null || client.qualification.budgetMin !== null, "rozpočet"],
    [!!client.qualification.timeline, "časový horizont"],
    [client.qualification.fit > 0, "hodnocení fitu"],
    [!!client.digital.goals, "cíle klienta"],
    [!!client.personality, "osobnost a komunikace"],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, l]) => l);
  const completeness = { score: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };

  /* ---------------- Health score (klienti s historií) ---------------- */
  let health: ClientAnalysis["health"] = null;
  if (client.status !== "lead" || invoices.length > 0 || won.length > 0) {
    const factors: Factor[] = [];
    // Komunikace
    const c =
      daysSinceContact === null ? 0 : daysSinceContact <= 14 ? 25 : daysSinceContact <= 30 ? 18 : daysSinceContact <= 60 ? 10 : 3;
    factors.push({
      label: "Kontakt",
      score: c,
      max: 25,
      detail: daysSinceContact === null ? "Žádná zaznamenaná komunikace" : `Poslední kontakt ${daysAgo(daysSinceContact)}`,
    });
    // Platby
    let pay = 15;
    let payDetail = "Zatím žádné faktury";
    if (invoices.length) {
      if (overdueInv.length) {
        pay = 5;
        payDetail = `${plural(overdueInv.length, "faktura", "faktury", "faktur")} po splatnosti`;
      } else if (avgDelay === null || avgDelay <= 3) {
        pay = 25;
        payDetail = avgDaysToPay === null ? "Bez zpoždění" : `Platí v průměru za ${Math.round(avgDaysToPay)} dní`;
      } else {
        pay = avgDelay <= 10 ? 18 : 10;
        payDetail = `Průměrné zpoždění ${Math.round(avgDelay)} dní`;
      }
    }
    factors.push({ label: "Platební morálka", score: pay, max: 25, detail: payDetail });
    // Úspěšnost
    const sr = sm.successRate;
    factors.push({
      label: "Úspěšnost projektů",
      score: sr === null ? 12 : Math.round(sr * 20),
      max: 20,
      detail: sr === null ? "Zatím žádný uzavřený projekt" : `${formatPercent(sr)} projektů dokončeno`,
    });
    // Ziskovost
    const margin = realizedRevenue > 0 && costsKnown ? profit / realizedRevenue : null;
    const target = ctx.settings.targetMargin;
    const m = margin === null ? 8 : margin >= target ? 15 : margin >= target / 2 ? 9 : margin > 0 ? 5 : 0;
    factors.push({
      label: "Ziskovost",
      score: m,
      max: 15,
      detail:
        margin === null
          ? costsKnown
            ? "Zatím bez dat"
            : "Chybí nákladové sazby týmu"
          : `Marže ${formatPercent(margin)} (cíl ${formatPercent(target)})`,
    });
    // Spokojenost
    const r = sm.avgRating;
    factors.push({
      label: "Spokojenost",
      score: r === null ? 8 : Math.round((r / 5) * 15),
      max: 15,
      detail: r === null ? "Bez hodnocení" : `Průměrné hodnocení ${r.toFixed(1)} / 5`,
    });
    const score = factors.reduce((s, f) => s + f.score, 0);
    health = {
      score,
      factors,
      label: score >= 75 ? "Zdravý vztah" : score >= 50 ? "Stabilní" : score >= 30 ? "Rizikový" : "Kritický",
      tone: score >= 75 ? "green" : score >= 50 ? "blue" : score >= 30 ? "amber" : "red",
    };
  }

  /* ---------------- Lead scoring ---------------- */
  let lead: ClientAnalysis["lead"] = null;
  if (client.status === "lead") {
    const q = client.qualification;
    const avg = averageProjectPrice(ctx) || 150_000;
    const budget = q.budgetMax ?? q.budgetMin;
    const factors: Factor[] = [
      {
        label: "Rozpočet",
        score: budget === null ? 5 : budget >= avg ? 30 : budget >= avg * 0.6 ? 20 : budget > 0 ? 10 : 5,
        max: 30,
        detail: budget === null ? "Rozpočet neznámý" : `${formatCZK(budget)} vs. průměrná zakázka ${formatCZK(avg)}`,
      },
      {
        label: "Fit s námi",
        score: q.fit > 0 ? q.fit * 5 : 8,
        max: 25,
        detail: q.fit > 0 ? `Hodnocení ${q.fit} / 5` : "Nehodnoceno",
      },
      {
        label: "Časový horizont",
        score: TIMELINE_POINTS[q.timeline] ?? 6,
        max: 20,
        detail: { asap: "Ihned", "1-3m": "Do 3 měsíců", "3-6m": "3–6 měsíců", "6m+": "Déle než 6 měsíců", "": "Neznámý" }[q.timeline],
      },
      {
        label: "Rozhodovatel",
        score: client.contacts.some((c) => c.isDecisionMaker) ? 15 : 3,
        max: 15,
        detail: client.contacts.some((c) => c.isDecisionMaker) ? "Jsme v kontaktu s rozhodovatelem" : "Rozhodovatel neznámý",
      },
      {
        label: "Aktivita",
        score: daysSinceContact === null ? 0 : daysSinceContact <= 7 ? 10 : daysSinceContact <= 21 ? 6 : 2,
        max: 10,
        detail: daysSinceContact === null ? "Bez kontaktu" : `Poslední kontakt ${daysAgo(daysSinceContact)}`,
      },
    ];
    const score = factors.reduce((s, f) => s + f.score, 0);
    const grade = score >= 75 ? "Hot" : score >= 50 ? "Warm" : "Cold";
    lead = {
      score,
      grade,
      factors,
      recommendation:
        grade === "Hot"
          ? "Prioritní lead – připravte nabídku a domluvte schůzku s rozhodovatelem tento týden."
          : grade === "Warm"
            ? "Slibný lead – doplňte chybějící kvalifikaci (rozpočet, rozhodovatel) a naplánujte follow-up."
            : "Studený lead – udržujte kontakt s nízkou intenzitou, investujte čas až po upřesnění rozpočtu a termínu.",
    };
  }

  /* ---------------- Rizika ---------------- */
  const flags: Flag[] = [];
  if (overdueInv.length)
    flags.push({
      level: "critical",
      text: `${plural(overdueInv.length, "faktura", "faktury", "faktur")} po splatnosti (${formatCZK(overdueInv.reduce((s, i) => s + i.amount, 0))})`,
    });
  if (overdueTasks.length) flags.push({ level: "warning", text: `${plural(overdueTasks.length, "úkol", "úkoly", "úkolů")} po termínu` });
  const contactLimit = client.status === "lead" ? 14 : 30;
  if (client.status !== "former" && daysSinceContact !== null && daysSinceContact > contactLimit)
    flags.push({ level: "warning", text: `Bez kontaktu ${daysSinceContact} dní` });
  if (client.status !== "former" && daysSinceContact === null)
    flags.push({ level: "warning", text: "Zatím žádná zaznamenaná komunikace" });
  if (client.retainer?.until && client.retainer.until >= day && daysBetween(day, client.retainer.until) <= 30)
    flags.push({ level: "warning", text: `Retainer končí ${client.retainer.until} – otevřete prodloužení` });
  if (byStatus.on_hold) flags.push({ level: "warning", text: `${plural(byStatus.on_hold, "pozastavený projekt", "pozastavené projekty", "pozastavených projektů")}` });
  const lowMargin = fin.filter((x) => x.f.revenue > 0 && x.f.margin < ctx.settings.targetMargin / 2);
  if (costsKnown && lowMargin.length) flags.push({ level: "warning", text: `${plural(lowMargin.length, "projekt", "projekty", "projektů")} s nízkou marží` });
  if (latePayments >= 2) flags.push({ level: "warning", text: `${latePayments}× zaplaceno po splatnosti` });
  if (!costsKnown && realized.length) flags.push({ level: "info", text: "Nastavte nákladové sazby týmu – bez nich nelze spočítat ziskovost" });
  if (!client.contacts.length) flags.push({ level: "info", text: "Chybí kontaktní osoba" });
  else if (!client.contacts.some((c) => c.isDecisionMaker)) flags.push({ level: "info", text: "Neznáme rozhodovatele" });
  if (client.status === "lead" && !openTasks.length) flags.push({ level: "info", text: "Lead nemá naplánovaný další krok" });
  if (client.status === "active" && !client.ico) flags.push({ level: "info", text: "Chybí IČO pro fakturaci" });

  /* ---------------- Doporučení ---------------- */
  const rec: string[] = [];
  if (overdueInv.length) rec.push("Pošlete upomínku k fakturám po splatnosti a zvažte zálohovou fakturaci u dalších zakázek.");
  if (overdueTasks.length) rec.push("Dořešte úkoly po termínu nebo je přeplánujte.");
  if (client.status !== "former" && (daysSinceContact === null || daysSinceContact > contactLimit))
    rec.push(client.status === "lead" ? "Ozvěte se leadu – follow-up do 2 dnů." : "Naplánujte check-in call se zákazníkem.");
  if (client.status === "active" && !mrr && won.length) rec.push("Nabídněte retainer na správu a rozvoj webu (opakovaný příjem).");
  if (client.status === "former") rec.push("Zkuste reaktivaci – nabídka redesignu nebo auditu výkonu webu.");
  if (costsKnown && lowMargin.length) rec.push("U dalších zakázek přepočítejte cenu – historicky nízká marže.");
  if (completeness.score < 60) rec.push(`Doplňte profil klienta (chybí: ${missing.slice(0, 3).join(", ")}).`);
  if (lead && lead.grade !== "Cold" && !openProposals.length) rec.push("Připravte a pošlete nabídku.");
  if (!rec.length) rec.push("Vše v pořádku – udržujte pravidelný kontakt.");

  return {
    finance: {
      invoiced,
      paid,
      outstanding: invoiced - paid,
      overdue: overdueInv.reduce((s, i) => s + i.amount, 0),
      overdueCount: overdueInv.length,
      invoiceCount: invoices.length,
      avgDaysToPay,
      avgDelay,
      latePayments,
      mrr,
      shareOfRevenue: agency12m > 0 ? revenue12m / agency12m : null,
      revenue12m,
      series,
      firstInvoice: sortedDates[0] ?? null,
      lastInvoice: sortedDates.at(-1) ?? null,
      potentialValue,
    },
    projects: {
      total: projects.length,
      byStatus,
      totalValue: won.reduce((s, p) => s + p.price, 0),
      avgValue: won.length ? won.reduce((s, p) => s + p.price, 0) / won.length : null,
      totalHours,
      effectiveRate: totalHours > 0 && realizedRevenue > 0 ? realizedRevenue / realized.reduce((s, x) => s + x.f.forecastHours, 0) : null,
      avgMargin: realizedRevenue > 0 && costsKnown ? profit / realizedRevenue : null,
      profit,
      successRate: sm.successRate,
      winRate: sm.winRate,
      avgRating: sm.avgRating,
      onTimeRate: sm.onTimeRate,
      hoursOverrun,
    },
    engagement: {
      lastContact,
      daysSinceContact,
      contacts90d,
      byType,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      nextTask: nextTask ? { title: nextTask.title, dueDate: nextTask.dueDate } : null,
      relationshipDays,
    },
    completeness,
    health,
    lead,
    flags,
    recommendations: rec,
  };
}

/** Lehká verze pro seznam klientů */
export function clientListMetrics(ctx: DataContext, client: Client) {
  const a = analyzeClient(ctx, client);
  return {
    revenue: a.finance.invoiced,
    mrr: a.finance.mrr,
    overdue: a.finance.overdue,
    projectCount: a.projects.total - a.projects.byStatus.lost,
    activeProjects: a.projects.byStatus.in_progress,
    lastContact: a.engagement.lastContact,
    score: a.lead?.score ?? a.health?.score ?? null,
    scoreKind: a.lead ? ("lead" as const) : a.health ? ("health" as const) : null,
    flags: a.flags.filter((f) => f.level !== "info").length,
    openTasks: a.engagement.openTasks,
  };
}

export { currentMRR };
