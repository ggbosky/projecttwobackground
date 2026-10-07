import { ArrowLeft, Briefcase, Building2, CalendarDays, Globe, Mail, MapPin, Phone, Repeat, Sparkles, StickyNote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CommunicationTimeline } from "@/components/clients/CommunicationTimeline";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Avatar } from "@/components/ui/Avatar";
import { ClientStatusBadge, InvoiceStatusBadge, Tag } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { clients, getClient, getMember, invoicesForClient, projectsForClient } from "@/lib/data";
import { formatCZK, formatDate, formatNumber } from "@/lib/format";
import { isRetainerActive } from "@/lib/metrics";

export function generateStaticParams() {
  return clients.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: getClient(id)?.company ?? "Klient" };
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();

  const owner = getMember(client.owner);
  const projects = projectsForClient(client.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const invoices = invoicesForClient(client.id).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  const ltv = invoices.reduce((s, i) => s + i.amount, 0);
  const open = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const rated = projects.filter((p) => typeof p.rating === "number");
  const avgRating = rated.length ? rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length : undefined;
  const retainerActive = isRetainerActive(client);

  return (
    <div className="animate-in">
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg">
        <ArrowLeft size={14} /> Zpět na klienty
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-line bg-gradient-to-br from-surface-2 to-surface-3 text-lg font-semibold text-fg-2">
            {client.company.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{client.company}</h1>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="mt-0.5 text-sm text-fg-2">
              {client.industry} · {client.city} · klientem od {formatDate(client.since)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {client.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${client.email}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <Mail size={15} /> Napsat e-mail
          </a>
          <a
            href={`tel:${client.phone.replace(/\s/g, "")}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card transition-all hover:brightness-110"
          >
            <Phone size={15} /> Zavolat
          </a>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Celkem vyfakturováno (LTV)" value={formatCZK(ltv)} />
        <Metric label="Neuhrazeno" value={formatCZK(open)} warn={open > 0} />
        <Metric label="Projekty" value={`${projects.filter((p) => p.status !== "lost").length}`} sub={`${projects.filter((p) => p.status === "in_progress").length} běží`} />
        <Metric
          label="Spokojenost"
          value={avgRating ? `${formatNumber(avgRating, 1)} / 5` : "—"}
          extra={avgRating ? <Stars value={avgRating} size={12} /> : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Projekty klienta" description="Historie spolupráce a stav zakázek" icon={<Briefcase size={15} />} />
            <CardBody>
              {projects.length ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {projects.map((p) => (
                    <ProjectCard key={p.id} project={p} showClient={false} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Zatím žádné projekty.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Historie komunikace" description="E-maily, hovory, schůzky a interní poznámky" />
            <CardBody>
              <CommunicationTimeline clientId={client.id} entries={client.communication} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Kontakt" icon={<Building2 size={15} />} />
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/50 p-3">
                <Avatar name={client.contactPerson} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{client.contactPerson}</p>
                  <p className="truncate text-xs text-muted">{client.contactRole}</p>
                </div>
              </div>
              <Info icon={<Mail size={14} />} label="E-mail">
                <a href={`mailto:${client.email}`} className="hover:text-accent">
                  {client.email}
                </a>
              </Info>
              <Info icon={<Phone size={14} />} label="Telefon">
                <a href={`tel:${client.phone.replace(/\s/g, "")}`} className="hover:text-accent">
                  {client.phone}
                </a>
              </Info>
              <Info icon={<Globe size={14} />} label="Web">
                <a href={`https://${client.website}`} target="_blank" rel="noreferrer" className="hover:text-accent">
                  {client.website}
                </a>
              </Info>
              <Info icon={<MapPin size={14} />} label="Město">{client.city}</Info>
              <Info icon={<CalendarDays size={14} />} label="Zdroj">{client.source}</Info>
              {owner && (
                <Info icon={<Avatar name={owner.name} color={owner.color} size="xs" />} label="Account owner">
                  {owner.name}
                </Info>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Osobnost & tým klienta" icon={<Sparkles size={15} />} />
            <CardBody>
              <p className="text-sm text-fg-2">{client.personality}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Interní poznámky" icon={<StickyNote size={15} />} />
            <CardBody>
              <p className="text-sm text-fg-2">{client.notes}</p>
            </CardBody>
          </Card>

          {client.retainer && (
            <Card>
              <CardHeader
                title="Retainer"
                icon={<Repeat size={15} />}
                action={
                  <span className={retainerActive ? "text-xs font-medium text-emerald-700 dark:text-emerald-400" : "text-xs text-muted"}>
                    {retainerActive ? "Aktivní" : "Ukončen"}
                  </span>
                }
              />
              <CardBody className="space-y-1 text-sm">
                <p className="text-xl font-semibold tracking-tight text-fg">
                  {formatCZK(client.retainer.monthly)}
                  <span className="text-sm font-normal text-muted"> / měsíc</span>
                </p>
                <p className="text-fg-2">{client.retainer.scope}</p>
                <p className="text-xs text-muted">
                  od {formatDate(client.retainer.since)}
                  {client.retainer.until ? ` do ${formatDate(client.retainer.until)}` : ""}
                </p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Faktury" description={`${invoices.length} dokladů`} />
            <div className="max-h-80 divide-y divide-line overflow-y-auto border-t border-line">
              {invoices.length === 0 && <p className="px-5 py-4 text-sm text-muted">Žádné faktury.</p>}
              {invoices.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-fg">{i.number}</p>
                    <p className="truncate text-xs text-muted">{i.label}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="tabular text-sm font-medium text-fg">{formatCZK(i.amount)}</span>
                    <InvoiceStatusBadge status={i.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, warn, extra }: { label: string; value: string; sub?: string; warn?: boolean; extra?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={warn ? "text-lg font-semibold text-red-600 dark:text-red-400" : "text-lg font-semibold text-fg"}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
      {extra}
    </div>
  );
}

function Info({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex w-5 justify-center text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p className="truncate text-fg">{children}</p>
      </div>
    </div>
  );
}
