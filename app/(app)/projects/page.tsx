import { CircleCheck, FolderKanban, Hourglass, Plus, Target } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCZKCompact, formatPercent } from "@/lib/format";
import { pipelineSummary, successMetrics } from "@/lib/metrics";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Projekty" };

export default async function ProjectsPage() {
  const { ctx } = await getData();
  const pipeline = pipelineSummary(ctx);
  const success = successMetrics(ctx.projects);
  const running = ctx.projects.filter((p) => p.status === "in_progress");
  const pct = (v: number | null) => (v === null ? "—" : formatPercent(v));

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Zakázky"
        title="Projekty"
        description="Všechny zakázky od nabídky po předání. Filtrujte podle stavu, typu, klienta, ceny a období."
        actions={
          <Link href="/projects/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110">
            <Plus size={15} /> Nový projekt
          </Link>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Běžící projekty" value={running.length} icon={<FolderKanban size={15} />} hint={`${formatCZKCompact(running.reduce((s, p) => s + p.price, 0))} v realizaci`} />
        <KpiCard label="Otevřené nabídky" value={pipeline.proposalCount} icon={<Target size={15} />} hint={`${formatCZKCompact(pipeline.proposalValue)} celkem`} />
        <KpiCard label="Úspěšně dokončeno" value={success.completed} icon={<CircleCheck size={15} />} hint={`úspěšnost ${pct(success.successRate)}`} />
        <KpiCard label="Dodáno v termínu" value={pct(success.onTimeRate)} icon={<Hourglass size={15} />} hint={`v rozpočtu hodin ${pct(success.onBudgetRate)}`} />
      </div>
      {ctx.projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface">
          <EmptyState
            icon={FolderKanban}
            title="Zatím žádné projekty"
            description="Založte nabídku nebo rozběhnutou zakázku. Projekt vždy patří ke klientovi."
            action={
              <Link href="/projects/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110">
                <Plus size={15} /> Přidat projekt
              </Link>
            }
          />
        </div>
      ) : (
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-line bg-surface" />}>
          <ProjectsExplorer projects={ctx.projects} clients={ctx.clients.map((c) => ({ id: c.id, name: c.company }))} users={ctx.users} />
        </Suspense>
      )}
    </div>
  );
}
