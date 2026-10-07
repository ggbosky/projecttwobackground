import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  ExternalLink,
  Layers,
  PauseCircle,
  Pencil,
  Quote,
  Target,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { deleteProjectAction } from "@/app/actions/projects";
import { InvoiceForm } from "@/components/finance/InvoiceForm";
import { InvoicesTable } from "@/components/finance/InvoicesTable";
import { Avatar } from "@/components/ui/Avatar";
import { ProjectStatusBadge, Tag } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Progress } from "@/components/ui/Progress";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { formatCZK, formatDate, formatHours, formatNumber, formatPercent, isoDate, parseDate, plural } from "@/lib/format";
import { memberById, projectFinancials } from "@/lib/metrics";
import { invoiceRows } from "@/lib/rows";
import { getData } from "@/lib/server/auth";
import { WEB_TYPE } from "@/lib/status";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { ctx } = await getData();
  return { title: ctx.projects.find((p) => p.id === id)?.name ?? "Projekt" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await getData();
  const project = ctx.projects.find((p) => p.id === id);
  if (!project) notFound();

  const client = ctx.clients.find((c) => c.id === project.clientId);
  const f = projectFinancials(ctx, project);
  const invoices = invoiceRows(ctx, ctx.invoices.filter((i) => i.projectId === project.id));
  const isDone = project.status === "completed";
  const isFailed = project.status === "cancelled" || project.status === "lost";
  const running = project.status === "in_progress" || project.status === "on_hold";
  const today = isoDate(ctx.today);

  const elapsedDays = project.startDate ? Math.max(0, Math.round((ctx.today.getTime() - parseDate(project.startDate).getTime()) / 864e5)) : 0;
  const timeShare = running && f.plannedDays > 0 ? Math.min(1, elapsedDays / f.plannedDays) : undefined;
  const dayVariance = f.actualDays !== undefined && f.plannedDays > 0 ? f.actualDays / f.plannedDays - 1 : undefined;

  return (
    <div className="animate-in">
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg">
        <ArrowLeft size={14} /> Zpět na projekty
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-2">
              <span className="size-2 rounded-[3px]" style={{ background: WEB_TYPE[project.type].color }} />
              {WEB_TYPE[project.type].label}
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{project.name}</h1>
          <p className="mt-1 text-sm text-fg-2">
            {client && (
              <Link href={`/clients/${client.id}`} className="font-medium text-fg hover:text-accent">
                {client.company}
              </Link>
            )}
            {project.startDate && ` · ${formatDate(project.startDate)} – ${formatDate(project.actualEndDate || project.plannedEndDate)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.liveUrl && (
            <a
              href={/^https?:\/\//.test(project.liveUrl) ? project.liveUrl : `https://${project.liveUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg hover:border-line-strong"
            >
              Živý web <ExternalLink size={14} />
            </a>
          )}
          <Link href={`/projects/${project.id}/edit`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110">
            <Pencil size={14} /> Upravit
          </Link>
          <ConfirmAction action={deleteProjectAction.bind(null, project.id)} confirmLabel="Opravdu smazat projekt?">
            <Trash2 size={14} /> Smazat
          </ConfirmAction>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={<Wallet size={14} />} label={isFailed ? "Cena nabídky" : "Cena zakázky"} value={formatCZK(project.price)}>
          {project.status === "proposal" && <p className="text-[11px] text-muted">Pravděpodobnost výhry {formatPercent(project.probability)}</p>}
          {!isFailed && project.status !== "proposal" && project.price > 0 && (
            <div className="mt-2 space-y-1">
              <Progress value={f.invoiced} max={project.price} label="Vyfakturováno" />
              <p className="text-[11px] text-muted">vyfakturováno {formatPercent(f.invoiced / project.price)}</p>
            </div>
          )}
        </MetricCard>
        <MetricCard
          icon={<Target size={14} />}
          label={f.isProjection ? "Zisk (projekce)" : "Zisk"}
          value={project.status === "lost" ? "—" : formatCZK(f.profit)}
          danger={f.profit < 0 && project.status !== "lost"}
        >
          {project.status !== "lost" && (
            <p className="text-[11px] text-muted">
              marže {formatPercent(f.margin)} · náklady {formatCZK(f.cost)}
            </p>
          )}
        </MetricCard>
        <MetricCard icon={<Clock size={14} />} label="Čas: plán → realita" value={`${formatHours(project.estimatedHours)} → ${formatHours(f.forecastHours)}`}>
          {project.estimatedHours > 0 && <Variance value={f.hoursVariance} suffix={f.isProjection ? " (odhad)" : ""} />}
        </MetricCard>
        <MetricCard
          icon={<CalendarDays size={14} />}
          label="Doba realizace"
          value={f.actualDays !== undefined ? `${f.actualDays} dní` : f.plannedDays ? `${elapsedDays} / ${f.plannedDays} dní` : "—"}
        >
          {dayVariance !== undefined ? (
            <Variance value={dayVariance} suffix={` vs. plán ${f.plannedDays} dní`} />
          ) : (
            timeShare !== undefined && (
              <div className="mt-2 space-y-1">
                <Progress value={timeShare} tone={project.progress / 100 < timeShare - 0.1 ? "warn" : "accent"} label="Uplynulý čas" />
                <p className="text-[11px] text-muted">
                  uplynulo {formatPercent(timeShare)} času · hotovo {project.progress} %
                </p>
              </div>
            )
          )}
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="O projektu" icon={<Layers size={15} />} />
            <CardBody className="space-y-4">
              <p className="text-sm whitespace-pre-line text-fg-2">{project.description || "Bez popisu."}</p>
              {project.stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.stack.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              )}
              {running && (
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted">Postup realizace</span>
                    <span className="tabular font-medium text-fg">{project.progress} %</span>
                  </div>
                  <Progress value={project.progress} max={100} tone={project.status === "on_hold" ? "warn" : "accent"} className="h-2" />
                </div>
              )}
              {(project.estimatedHours > 0 || f.plannedDays > 0) && (
                <PlanVsActual
                  rows={[
                    ...(project.estimatedHours > 0
                      ? [{ label: "Hodiny", planned: project.estimatedHours, actual: f.forecastHours, unit: "h", projection: f.isProjection }]
                      : []),
                    ...(f.plannedDays > 0
                      ? [
                          {
                            label: "Dny",
                            planned: f.plannedDays,
                            actual: f.actualDays ?? (running ? Math.max(elapsedDays, f.plannedDays) : f.plannedDays),
                            unit: "dní",
                            projection: f.actualDays === undefined,
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            </CardBody>
          </Card>

          {project.status === "on_hold" && project.holdReason && (
            <Card className="border-amber-500/30">
              <CardHeader title="Projekt je pozastaven" icon={<PauseCircle size={15} className="text-amber-500" />} />
              <CardBody>
                <p className="text-sm text-fg-2">{project.holdReason}</p>
              </CardBody>
            </Card>
          )}

          {(isDone || isFailed) && (
            <Card>
              <CardHeader
                title={isDone ? "Případová studie – proč se to povedlo" : "Win/Loss – proč to nevyšlo"}
                icon={isDone ? <CircleCheck size={15} className="text-emerald-500" /> : <CircleX size={15} className="text-red-500" />}
                action={project.rating ? <Stars value={project.rating} /> : undefined}
              />
              <CardBody className="space-y-4">
                {project.outcomeReasons.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {project.outcomeReasons.map((r) => (
                      <li
                        key={r}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
                          isDone
                            ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"
                            : "border-red-500/25 bg-red-500/5 text-red-800 dark:text-red-300",
                        )}
                      >
                        {isDone ? <CircleCheck size={13} /> : <CircleX size={13} />}
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">
                    Důvody zatím nejsou vyplněné.{" "}
                    <Link href={`/projects/${project.id}/edit`} className="text-accent hover:underline">
                      Doplnit
                    </Link>
                  </p>
                )}
                {project.feedback && (
                  <figure className="relative rounded-xl border border-line bg-surface-2/50 p-4 pl-11">
                    <Quote size={18} className="absolute top-4 left-4 text-muted" />
                    <blockquote className="text-sm text-fg italic">„{project.feedback}“</blockquote>
                    {client && <figcaption className="mt-2 text-xs text-muted">— {client.company}</figcaption>}
                  </figure>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Faktury k projektu" description={plural(invoices.length, "doklad", "doklady", "dokladů")} />
            {client && (
              <div className="px-5 pb-4">
                <InvoiceForm
                  clients={[{ id: client.id, name: client.company }]}
                  projects={[{ id: project.id, name: project.name, clientId: client.id }]}
                  fixedClientId={client.id}
                  defaultProjectId={project.id}
                  today={today}
                />
              </div>
            )}
            <InvoicesTable invoices={invoices} compact />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Tým projektu" icon={<Users size={15} />} description={project.team.length ? `vážená nákladová sazba ${formatNumber(f.rate)} Kč/h` : undefined} />
            <CardBody className="space-y-3">
              {project.team.length === 0 && <p className="text-sm text-muted">Tým nebyl přiřazen.</p>}
              {project.team.map((a) => {
                const m = memberById(ctx, a.memberId);
                if (!m) return null;
                return (
                  <Link key={a.memberId} href={`/team#${m.id}`} className="group flex items-center gap-3">
                    <Avatar name={m.name} color={m.color} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg group-hover:text-accent">{m.name}</p>
                      <p className="truncate text-xs text-muted">{m.role}</p>
                    </div>
                    <span className="tabular text-xs text-fg-2">{a.hoursPerWeek} h/týd.</span>
                  </Link>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Ekonomika zakázky" icon={<Wallet size={15} />} />
            <CardBody>
              <dl className="space-y-2 text-sm">
                <Row label="Cena zakázky" value={formatCZK(project.price)} />
                <Row label="Vyfakturováno" value={formatCZK(f.invoiced)} />
                <Row label="Uhrazeno" value={formatCZK(f.paid)} />
                <Row label="Zbývá vyfakturovat" value={formatCZK(f.remaining)} />
                <div className="my-2 border-t border-line" />
                <Row label={`Práce (${formatHours(f.forecastHours)} × ${formatNumber(f.rate)} Kč)`} value={formatCZK(f.cost - project.externalCosts)} />
                <Row label="Externí náklady" value={formatCZK(project.externalCosts)} />
                <Row label={f.isProjection ? "Zisk (projekce)" : "Zisk"} value={formatCZK(f.profit)} strong danger={f.profit < 0} />
                <Row label="Efektivní hodinová sazba" value={f.effectiveRate ? `${formatNumber(f.effectiveRate)} Kč/h` : "—"} />
              </dl>
              {f.rate === 0 && (
                <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-300">
                  Nákladová sazba je 0 Kč/h – nastavte ji v Nastavení → Profil, jinak bude zisk nadhodnocený.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, children, danger }: { icon: ReactNode; label: string; value: string; children?: ReactNode; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1.5 text-lg font-semibold tracking-tight", danger ? "text-red-600 dark:text-red-400" : "text-fg")}>{value}</p>
      {children}
    </div>
  );
}

function Variance({ value, suffix = "" }: { value: number; suffix?: string }) {
  const tone = value > 0.1 ? "text-red-600 dark:text-red-400" : value > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400";
  return (
    <p className="text-[11px]">
      <span className={cn("font-medium", tone)}>
        {value > 0 ? "+" : ""}
        {formatPercent(value, 1)}
      </span>
      <span className="text-muted">{suffix}</span>
    </p>
  );
}

function Row({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-fg-2">{label}</dt>
      <dd className={cn("tabular", strong && "font-semibold", danger ? "text-red-600 dark:text-red-400" : "text-fg")}>{value}</dd>
    </div>
  );
}

function PlanVsActual({ rows }: { rows: { label: string; planned: number; actual: number; unit: string; projection: boolean }[] }) {
  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface-2/40 p-3">
      <p className="text-xs font-medium text-fg">Plán vs. realita</p>
      {rows.map((r) => {
        const max = Math.max(r.planned, r.actual, 1);
        const over = r.actual > r.planned;
        return (
          <div key={r.label} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted">{r.label}</span>
              <span className="tabular text-fg-2">
                {formatNumber(r.planned)} → {formatNumber(r.actual)} {r.unit}
                {r.projection && <span className="text-muted"> (odhad)</span>}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-surface-3">
              <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--series-neutral)]" style={{ width: `${(r.planned / max) * 100}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--series-1)]" style={{ width: `${(Math.min(r.actual, r.planned) / max) * 100}%` }} />
              {over && (
                <div className="absolute inset-y-0 rounded-r-full bg-red-500/80" style={{ left: `${(r.planned / max) * 100}%`, width: `${((r.actual - r.planned) / max) * 100}%` }} />
              )}
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-muted">Šedá = plán · modrá = v rámci plánu · červená = přečerpání</p>
    </div>
  );
}
