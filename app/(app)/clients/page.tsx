import { Building2, Plus, Repeat, TriangleAlert, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClientsExplorer, type ClientRow } from "@/components/clients/ClientsExplorer";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { clientListMetrics } from "@/lib/analysis";
import { formatCZKCompact } from "@/lib/format";
import { currentMRR, memberById } from "@/lib/metrics";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Klienti" };

export default async function ClientsPage() {
  const { ctx } = await getData();

  const rows: ClientRow[] = [...ctx.clients].reverse().map((c) => {
    const m = clientListMetrics(ctx, c);
    const owner = memberById(ctx, c.ownerId);
    const primary = c.contacts.find((p) => p.isDecisionMaker) ?? c.contacts[0];
    return {
      id: c.id,
      company: c.company,
      contactName: primary?.name ?? "",
      contactEmail: primary?.email ?? "",
      contactPhone: primary?.phone ?? "",
      website: c.website,
      industry: c.industry,
      city: c.city,
      status: c.status,
      priority: c.priority,
      tags: c.tags,
      ...m,
      owner: owner ? { id: owner.id, name: owner.name, color: owner.color } : undefined,
    };
  });

  const active = ctx.clients.filter((c) => c.status === "active").length;
  const leads = ctx.clients.filter((c) => c.status === "lead").length;
  const attention = rows.filter((r) => r.flags > 0).length;
  const mrr = currentMRR(ctx);

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="CRM"
        title="Klienti"
        description="Databáze klientů a leadů. U každého detailní profil, kvalifikace, komunikace, úkoly, projekty, faktury a automatická analýza."
        actions={
          <Link href="/clients/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110">
            <Plus size={15} /> Nový klient
          </Link>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Aktivní klienti" value={active} icon={<Building2 size={15} />} hint={`z ${ctx.clients.length} celkem`} />
        <KpiCard label="Leady" value={leads} icon={<UserPlus size={15} />} hint="potenciální klienti" />
        <KpiCard label="Vyžaduje pozornost" value={attention} icon={<TriangleAlert size={15} />} hint="po splatnosti, bez kontaktu, úkoly" />
        <KpiCard label="MRR z retainerů" value={formatCZKCompact(mrr)} icon={<Repeat size={15} />} hint={`ARR ${formatCZKCompact(mrr * 12)}`} />
      </div>
      <ClientsExplorer rows={rows} owners={ctx.users.map((u) => ({ id: u.id, name: u.name }))} />
    </div>
  );
}
