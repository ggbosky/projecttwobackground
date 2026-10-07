import {
  ArrowLeft,
  Building2,
  ExternalLink,
  FolderPlus,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Repeat,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { deleteClientAction } from "@/app/actions/clients";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { FactorBars, FlagList, Metric, Recommendations, ScoreGauge } from "@/components/clients/AnalysisPanels";
import { CommunicationLog, TaskList } from "@/components/clients/ClientActivity";
import { ClientTabs } from "@/components/clients/ClientTabs";
import { InvoiceForm } from "@/components/finance/InvoiceForm";
import { InvoicesTable } from "@/components/finance/InvoicesTable";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Avatar } from "@/components/ui/Avatar";
import { ClientStatusBadge, PriorityBadge, Tag } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Progress } from "@/components/ui/Progress";
import { Stars } from "@/components/ui/Stars";
import { analyzeClient } from "@/lib/analysis";
import { cn } from "@/lib/cn";
import { formatCZK, formatDate, formatNumber, formatPercent, formatRelative, isoDate, plural } from "@/lib/format";
import { memberById } from "@/lib/metrics";
import { invoiceRows } from "@/lib/rows";
import { getData } from "@/lib/server/auth";
import { COMM_TYPE, COMPANY_SIZE, PROJECT_STATUS, TIMELINE } from "@/lib/status";
import type { CommunicationType, ProjectStatus } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { ctx } = await getData();
  return { title: ctx.clients.find((c) => c.id === id)?.company ?? "Klient" };
}

function href(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, ctx } = await getData();
  const client = ctx.clients.find((c) => c.id === id);
  if (!client) notFound();

  const a = analyzeClient(ctx, client);
  const owner = memberById(ctx, client.ownerId);
  const today = isoDate(ctx.today);
  const projects = ctx.projects.filter((p) => p.clientId === client.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  const invoices = invoiceRows(ctx, ctx.invoices.filter((i) => i.clientId === client.id));
  const q = client.qualification;
  const d = client.digital;
  const primary = client.contacts.find((p) => p.isDecisionMaker) ?? client.contacts[0];
  const hasMoney = a.finance.invoiceCount > 0;

  /* ---------------- Záložka: Analýza ---------------- */
  const analysis = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {a.lead && (
          <Card>
            <CardHeader title="Lead score" description="Jak pravděpodobně z leadu bude zakázka" icon={<Target size={15} />} />
            <CardBody className="space-y-5">
              <ScoreGauge score={a.lead.score} label={a.lead.grade === "Hot" ? "Hot lead" : a.lead.grade === "Warm" ? "Warm lead" : "Cold lead"} sub={a.lead.recommendation} />
              <FactorBars factors={a.lead.factors} />
            </CardBody>
          </Card>
        )}
        {a.health && (
          <Card>
            <CardHeader title="Zdraví vztahu" description="Kontakt, platby, úspěšnost, ziskovost a spokojenost" icon={<Sparkles size={15} />} />
            <CardBody className="space-y-5">
              <ScoreGauge score={a.health.score} label={a.health.label} sub="Skóre 0–100 z pěti faktorů" />
              <FactorBars factors={a.health.factors} />
            </CardBody>
          </Card>
        )}
        <Card className={cn(!(a.lead && a.health) && "xl:col-span-2")}>
          <CardHeader title="Rizika a doporučení" icon={<ShieldAlert size={15} />} />
          <CardBody className="space-y-5">
            <FlagList flags={a.flags} />
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Doporučené další kroky</p>
              <Recommendations items={a.recommendations} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-fg-2">Úplnost profilu</span>
                <span className="tabular text-muted">{a.completeness.score} %</span>
              </div>
              <Progress value={a.completeness.score} max={100} tone={a.completeness.score >= 75 ? "good" : a.completeness.score >= 50 ? "accent" : "warn"} />
              {a.completeness.missing.length > 0 && (
                <p className="mt-1.5 text-[11px] text-muted">
                  Chybí: {a.completeness.missing.join(", ")} ·{" "}
                  <Link href={`/clients/${client.id}/edit`} className="text-accent hover:underline">
                    doplnit
                  </Link>
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Finanční analýza" description="Vše, co jsme klientovi vyfakturovali, a jak platí" />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <Metric label="Celkem vyfakturováno (LTV)" value={formatCZK(a.finance.invoiced)} sub={plural(a.finance.invoiceCount, "faktura", "faktury", "faktur")} />
            <Metric label="Uhrazeno" value={formatCZK(a.finance.paid)} />
            <Metric label="Neuhrazeno" value={formatCZK(a.finance.outstanding)} tone={a.finance.outstanding > 0 ? undefined : undefined} />
            <Metric label="Po splatnosti" value={formatCZK(a.finance.overdue)} tone={a.finance.overdue > 0 ? "danger" : undefined} sub={a.finance.overdueCount ? plural(a.finance.overdueCount, "faktura", "faktury", "faktur") : undefined} />
            <Metric label="MRR (retainer)" value={formatCZK(a.finance.mrr)} sub={a.finance.mrr ? `ARR ${formatCZK(a.finance.mrr * 12)}` : undefined} />
            <Metric
              label="Podíl na obratu (12 M)"
              value={a.finance.shareOfRevenue === null ? "—" : formatPercent(a.finance.shareOfRevenue, 1)}
              sub={a.finance.shareOfRevenue !== null && a.finance.shareOfRevenue > 0.3 ? "vysoká závislost" : undefined}
            />
            <Metric label="Průměrná doba úhrady" value={a.finance.avgDaysToPay === null ? "—" : `${Math.round(a.finance.avgDaysToPay)} dní`} />
            <Metric
              label="Průměrné zpoždění"
              value={a.finance.avgDelay === null ? "—" : `${Math.round(a.finance.avgDelay)} dní`}
              tone={a.finance.avgDelay && a.finance.avgDelay > 5 ? "danger" : undefined}
            />
            <Metric label="Pozdní úhrady" value={a.finance.latePayments} />
            <Metric label="Obrat 12 měsíců" value={formatCZK(a.finance.revenue12m)} />
            <Metric label="První faktura" value={a.finance.firstInvoice ? formatDate(a.finance.firstInvoice) : "—"} />
            <Metric label="Potenciál nabídek" value={formatCZK(a.finance.potentialValue)} sub="vážený pravděpodobností" />
          </div>
          {hasMoney ? (
            <RevenueChart data={a.finance.series} height={220} showToggle={false} showExpenses={false} />
          ) : (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
              Graf příjmů se zobrazí po vystavení první faktury (záložka Projekty & faktury).
            </p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Projektová analýza" />
          <CardBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="Projektů celkem" value={a.projects.total} />
              <Metric label="Hodnota zakázek" value={formatCZK(a.projects.totalValue)} />
              <Metric label="Průměrná zakázka" value={a.projects.avgValue === null ? "—" : formatCZK(a.projects.avgValue)} />
              <Metric label="Odpracováno" value={`${formatNumber(a.projects.totalHours)} h`} />
              <Metric label="Efektivní sazba" value={a.projects.effectiveRate === null ? "—" : `${formatNumber(a.projects.effectiveRate)} Kč/h`} />
              <Metric
                label="Průměrná marže"
                value={a.projects.avgMargin === null ? "—" : formatPercent(a.projects.avgMargin)}
                tone={a.projects.avgMargin !== null && a.projects.avgMargin < ctx.settings.targetMargin ? "danger" : a.projects.avgMargin !== null ? "good" : undefined}
              />
              <Metric label="Úspěšnost" value={a.projects.successRate === null ? "—" : formatPercent(a.projects.successRate)} />
              <Metric label="Win rate nabídek" value={a.projects.winRate === null ? "—" : formatPercent(a.projects.winRate)} />
              <Metric
                label="Hodiny vs. odhad"
                value={a.projects.hoursOverrun === null ? "—" : `${a.projects.hoursOverrun > 0 ? "+" : ""}${formatPercent(a.projects.hoursOverrun)}`}
                tone={a.projects.hoursOverrun !== null && a.projects.hoursOverrun > 0.1 ? "danger" : undefined}
              />
              <Metric label="V termínu" value={a.projects.onTimeRate === null ? "—" : formatPercent(a.projects.onTimeRate)} />
              <Metric label="Hodnocení" value={a.projects.avgRating === null ? "—" : `${a.projects.avgRating.toFixed(1)} / 5`} sub={a.projects.avgRating ? <Stars value={a.projects.avgRating} size={11} /> : undefined} />
              <Metric label="Zisk z projektů" value={formatCZK(a.projects.profit)} tone={a.projects.profit < 0 ? "danger" : undefined} />
            </div>
            {a.projects.total > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(Object.entries(a.projects.byStatus) as [ProjectStatus, number][])
                  .filter(([, n]) => n > 0)
                  .map(([s, n]) => (
                    <Tag key={s}>
                      {PROJECT_STATUS[s].label}: {n}
                    </Tag>
                  ))}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Komunikace & aktivita" />
          <CardBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric
                label="Poslední kontakt"
                value={a.engagement.lastContact ? formatRelative(a.engagement.lastContact, ctx.today) : "nikdy"}
                tone={a.engagement.daysSinceContact !== null && a.engagement.daysSinceContact > 30 ? "danger" : undefined}
              />
              <Metric label="Kontaktů za 90 dní" value={a.engagement.contacts90d} />
              <Metric label="Ve vztahu" value={a.engagement.relationshipDays === null ? "—" : `${a.engagement.relationshipDays} dní`} />
              <Metric label="Otevřené úkoly" value={a.engagement.openTasks} />
              <Metric label="Úkoly po termínu" value={a.engagement.overdueTasks} tone={a.engagement.overdueTasks ? "danger" : undefined} />
              <Metric label="Kontaktních osob" value={client.contacts.length} />
            </div>
            <div className="mt-4 space-y-2">
              {(Object.entries(a.engagement.byType) as [CommunicationType, number][]).map(([t, n]) => {
                const max = Math.max(1, ...Object.values(a.engagement.byType));
                return (
                  <div key={t} className="grid grid-cols-[80px_1fr_24px] items-center gap-3 text-xs">
                    <span className="text-fg-2">{COMM_TYPE[t]}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${(n / max) * 100}%` }} />
                    </div>
                    <span className="tabular text-right text-muted">{n}</span>
                  </div>
                );
              })}
            </div>
            {a.engagement.nextTask && (
              <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-xs text-fg">
                Další krok: <strong>{a.engagement.nextTask.title}</strong>
                {a.engagement.nextTask.dueDate && ` · ${formatDate(a.engagement.nextTask.dueDate)}`}
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );

  /* ---------------- Záložka: Profil ---------------- */
  const profile = (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <Card>
          <CardHeader title="Kontaktní osoby" icon={<UserRound size={15} />} description={plural(client.contacts.length, "osoba", "osoby", "osob")} />
          <CardBody>
            {client.contacts.length === 0 ? (
              <p className="text-sm text-muted">
                Zatím žádné kontakty.{" "}
                <Link href={`/clients/${client.id}/edit#kontakty`} className="text-accent hover:underline">
                  Přidat
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {client.contacts.map((p) => (
                  <div key={p.id} className="rounded-lg border border-line bg-surface-2/40 p-3">
                    <div className="flex items-start gap-3">
                      <Avatar name={p.name || "?"} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-medium text-fg">{p.name || "Bez jména"}</p>
                          {p.isDecisionMaker && <span className="rounded bg-accent-soft px-1.5 text-[10px] font-medium text-accent">Rozhoduje</span>}
                        </div>
                        <p className="text-xs text-muted">{p.role}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-xs">
                      {p.email && (
                        <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-fg-2 hover:text-accent">
                          <Mail size={12} /> {p.email}
                        </a>
                      )}
                      {p.phone && (
                        <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-fg-2 hover:text-accent">
                          <Phone size={12} /> {p.phone}
                        </a>
                      )}
                      {p.linkedin && (
                        <a href={href(p.linkedin)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-fg-2 hover:text-accent">
                          <ExternalLink size={12} /> LinkedIn
                        </a>
                      )}
                    </div>
                    {p.note && <p className="mt-2 border-t border-line pt-2 text-xs whitespace-pre-line text-fg-2">{p.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Obchodní kvalifikace" icon={<Target size={15} />} />
          <CardBody>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Info label="Rozpočet">
                {q.budgetMin === null && q.budgetMax === null
                  ? "—"
                  : `${q.budgetMin !== null ? formatCZK(q.budgetMin) : "?"} – ${q.budgetMax !== null ? formatCZK(q.budgetMax) : "?"}`}
              </Info>
              <Info label="Časový horizont">{TIMELINE[q.timeline]}</Info>
              <Info label="Shoda s ideálním klientem">{q.fit ? <Stars value={q.fit} /> : "Nehodnoceno"}</Info>
              <Info label="Konkurence">{q.competitors || "—"}</Info>
              <Info label="Co potřebují" wide>
                {q.needs || "—"}
              </Info>
              <Info label="Bolesti a problémy" wide>
                {q.painPoints || "—"}
              </Info>
              <Info label="Jak rozhodují" wide>
                {q.decisionProcess || "—"}
              </Info>
              <Info label="Proč my" wide>
                {q.whyUs || "—"}
              </Info>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Digitální stav" icon={<Globe size={15} />} />
          <CardBody>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Info label="Současný web">
                {d.currentWebsite ? (
                  <a href={href(d.currentWebsite)} target="_blank" rel="noreferrer" className="hover:text-accent">
                    {d.currentWebsite}
                  </a>
                ) : (
                  "—"
                )}
              </Info>
              <Info label="Platforma">{d.platform || "—"}</Info>
              <Info label="Stáří webu">{d.websiteAge || "—"}</Info>
              <Info label="Instagram">{d.instagram || "—"}</Info>
              <Info label="Facebook">{d.facebook || "—"}</Info>
              <Info label="LinkedIn">{d.linkedin || "—"}</Info>
              <Info label="Cíle" wide>
                {d.goals || "—"}
              </Info>
              <Info label="KPI" wide>
                {d.kpis || "—"}
              </Info>
            </dl>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Firma" icon={<Building2 size={15} />} />
          <CardBody>
            <dl className="space-y-3">
              <Info label="IČO / DIČ">{[client.ico, client.dic].filter(Boolean).join(" · ") || "—"}</Info>
              <Info label="Odvětví">{client.industry || "—"}</Info>
              <Info label="Velikost">{COMPANY_SIZE[client.size]}</Info>
              <Info label="Roční obrat">{client.annualRevenue ? formatCZK(client.annualRevenue) : "—"}</Info>
              <Info label="Adresa">
                {[client.street, [client.zip, client.city].filter(Boolean).join(" "), client.country].filter(Boolean).join(", ") || "—"}
              </Info>
              <Info label="Web">
                {client.website ? (
                  <a href={href(client.website)} target="_blank" rel="noreferrer" className="hover:text-accent">
                    {client.website}
                  </a>
                ) : (
                  "—"
                )}
              </Info>
              <Info label="Zdroj">{client.source || "—"}</Info>
              <Info label="V kontaktu od">{client.since ? formatDate(client.since) : "—"}</Info>
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Fakturace & retainer" icon={<Repeat size={15} />} />
          <CardBody>
            <dl className="space-y-3">
              <Info label="Fakturační e-mail">{client.billingEmail || "—"}</Info>
              <Info label="Splatnost">{client.paymentTermsDays} dní</Info>
              <Info label="Retainer">
                {client.retainer ? (
                  <>
                    {formatCZK(client.retainer.monthly)} / měsíc
                    <span className="block text-xs text-muted">
                      {client.retainer.scope}
                      {client.retainer.since && ` · od ${formatDate(client.retainer.since)}`}
                      {client.retainer.until && ` do ${formatDate(client.retainer.until)}`}
                    </span>
                  </>
                ) : (
                  "Bez retaineru"
                )}
              </Info>
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Osobnost & komunikace" icon={<Sparkles size={15} />} />
          <CardBody>
            <p className="text-sm whitespace-pre-line text-fg-2">{client.personality || "Zatím nic. Jak s klientem jednat, co ocení, na co si dát pozor?"}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Interní poznámky" icon={<StickyNote size={15} />} />
          <CardBody>
            <p className="text-sm whitespace-pre-line text-fg-2">{client.notes || "—"}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  /* ---------------- Záložka: Komunikace & úkoly ---------------- */
  const activity = (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <CardHeader title="Historie komunikace" description="E-maily, hovory, schůzky a interní poznámky" />
        <CardBody>
          <CommunicationLog clientId={client.id} entries={client.communication} users={ctx.users} meId={me.id} today={today} />
        </CardBody>
      </Card>
      <Card className="h-fit xl:col-span-2">
        <CardHeader title="Úkoly a další kroky" />
        <CardBody>
          <TaskList clientId={client.id} tasks={client.tasks} users={ctx.users} meId={me.id} today={today} />
        </CardBody>
      </Card>
    </div>
  );

  /* ---------------- Záložka: Projekty & faktury ---------------- */
  const work = (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Projekty"
          action={
            <Link
              href={`/projects/new?client=${client.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fg hover:border-line-strong"
            >
              <FolderPlus size={14} /> Nový projekt
            </Link>
          }
        />
        <CardBody>
          {projects.length === 0 ? (
            <p className="text-sm text-muted">Zatím žádné projekty ani nabídky.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} users={ctx.users} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Faktury" description={`${plural(invoices.length, "doklad", "doklady", "dokladů")} · ${formatCZK(a.finance.invoiced)}`} />
        <div className="px-5 pb-4">
          <InvoiceForm
            clients={[{ id: client.id, name: client.company }]}
            projects={projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId }))}
            fixedClientId={client.id}
            today={today}
          />
        </div>
        <InvoicesTable invoices={invoices} compact />
      </Card>
    </div>
  );

  return (
    <div className="animate-in">
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg">
        <ArrowLeft size={14} /> Zpět na klienty
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-line bg-gradient-to-br from-surface-2 to-surface-3 text-lg font-semibold text-fg-2">
            {client.company.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{client.company}</h1>
              <ClientStatusBadge status={client.status} />
              <PriorityBadge priority={client.priority} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-2">
              {client.industry && <span>{client.industry}</span>}
              {client.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {client.city}
                </span>
              )}
              {owner && (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={owner.name} color={owner.color} size="xs" /> {owner.name}
                </span>
              )}
            </p>
            {client.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {client.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {primary?.email && (
            <a
              href={`mailto:${primary.email}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg hover:border-line-strong hover:bg-surface-2"
            >
              <Mail size={15} /> E-mail
            </a>
          )}
          {primary?.phone && (
            <a
              href={`tel:${primary.phone.replace(/\s/g, "")}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg hover:border-line-strong hover:bg-surface-2"
            >
              <Phone size={15} /> {primary.phone}
            </a>
          )}
          <Link
            href={`/clients/${client.id}/edit`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110"
          >
            <Pencil size={14} /> Upravit
          </Link>
          <ConfirmAction action={deleteClientAction.bind(null, client.id)} confirmLabel="Smazat i projekty a faktury?">
            <Trash2 size={14} /> Smazat
          </ConfirmAction>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="LTV" value={formatCZK(a.finance.invoiced)} />
        <Metric label="MRR" value={formatCZK(a.finance.mrr)} />
        <Metric label="Po splatnosti" value={formatCZK(a.finance.overdue)} tone={a.finance.overdue ? "danger" : undefined} />
        <Metric label="Projekty" value={a.projects.total} sub={a.projects.byStatus.in_progress ? `${a.projects.byStatus.in_progress} běží` : undefined} />
        <Metric
          label={a.lead ? "Lead score" : "Zdraví vztahu"}
          value={a.lead ? `${a.lead.score} / 100` : a.health ? `${a.health.score} / 100` : "—"}
          sub={a.lead?.grade ?? a.health?.label}
        />
        <Metric label="Poslední kontakt" value={a.engagement.lastContact ? formatRelative(a.engagement.lastContact, ctx.today) : "nikdy"} />
      </div>

      <ClientTabs
        tabs={[
          { id: "analyza", label: "Analýza", count: a.flags.filter((f) => f.level !== "info").length || undefined, content: analysis },
          { id: "profil", label: "Profil & detaily", content: profile },
          { id: "aktivita", label: "Komunikace & úkoly", count: client.communication.length + a.engagement.openTasks, content: activity },
          { id: "prace", label: "Projekty & faktury", count: projects.length + invoices.length, content: work },
        ]}
      />
    </div>
  );
}

function Info({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-full")}>
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm break-words whitespace-pre-line text-fg">{children}</dd>
    </div>
  );
}
