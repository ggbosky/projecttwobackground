import { Building2, Repeat, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import { ClientsExplorer, type ClientRow } from "@/components/clients/ClientsExplorer";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { clients, getMember, invoicesForClient, projectsForClient } from "@/lib/data";
import { formatCZKCompact } from "@/lib/format";
import { currentMRR, isRetainerActive } from "@/lib/metrics";

export const metadata: Metadata = { title: "Klienti" };

export default function ClientsPage() {
  const rows: ClientRow[] = clients.map((c) => {
    const owner = getMember(c.owner);
    const projects = projectsForClient(c.id);
    return {
      id: c.id,
      company: c.company,
      contactPerson: c.contactPerson,
      contactRole: c.contactRole,
      email: c.email,
      phone: c.phone,
      website: c.website,
      industry: c.industry,
      city: c.city,
      status: c.status,
      tags: c.tags,
      projectCount: projects.filter((p) => p.status !== "lost").length,
      activeProjects: projects.filter((p) => p.status === "in_progress").length,
      revenue: invoicesForClient(c.id).reduce((s, i) => s + i.amount, 0),
      mrr: isRetainerActive(c) ? (c.retainer?.monthly ?? 0) : 0,
      lastContact: [...c.communication].sort((a, b) => b.date.localeCompare(a.date))[0]?.date,
      owner: owner ? { name: owner.name, color: owner.color } : undefined,
    };
  });

  const active = clients.filter((c) => c.status === "active").length;
  const leads = clients.filter((c) => c.status === "lead").length;
  const ltv = rows.filter((r) => r.revenue > 0);
  const avgLtv = ltv.reduce((s, r) => s + r.revenue, 0) / Math.max(1, ltv.length);

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="CRM"
        title="Klienti"
        description="Databáze klientů, stav vztahu, kontakty a historie komunikace. Klikněte na klienta pro detail."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Aktivní klienti" value={active} icon={<Building2 size={15} />} hint={`z ${clients.length} celkem`} />
        <KpiCard label="Potenciální (leady)" value={leads} icon={<UserPlus size={15} />} hint="v obchodním jednání" />
        <KpiCard label="Průměrné LTV" value={formatCZKCompact(avgLtv)} icon={<Users size={15} />} hint="vyfakturováno na klienta" />
        <KpiCard
          label="Klienti s retainerem"
          value={clients.filter((c) => isRetainerActive(c)).length}
          icon={<Repeat size={15} />}
          hint={`MRR ${formatCZKCompact(currentMRR())}`}
        />
      </div>
      <ClientsExplorer rows={rows} />
    </div>
  );
}
