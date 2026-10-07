import { CircleCheck, FolderKanban, Hourglass, Target } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { projects } from "@/lib/data";
import { formatCZKCompact, formatPercent } from "@/lib/format";
import { pipelineSummary, successMetrics } from "@/lib/metrics";

export const metadata: Metadata = { title: "Projekty" };

export default function ProjectsPage() {
  const pipeline = pipelineSummary();
  const success = successMetrics();
  const running = projects.filter((p) => p.status === "in_progress");
  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Zakázky"
        title="Projekty"
        description="Všechny zakázky agentury – od nabídky po předání. Filtrujte podle stavu, typu, klienta, ceny a období; filtry se ukládají do URL."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Běžící projekty" value={running.length} icon={<FolderKanban size={15} />} hint={`${formatCZKCompact(running.reduce((s, p) => s + p.price, 0))} v realizaci`} />
        <KpiCard label="Otevřené nabídky" value={pipeline.proposalCount} icon={<Target size={15} />} hint={`${formatCZKCompact(pipeline.proposalValue)} celkem`} />
        <KpiCard label="Úspěšně dokončeno" value={success.completed} icon={<CircleCheck size={15} />} hint={`úspěšnost ${formatPercent(success.successRate)}`} />
        <KpiCard label="Dodáno v termínu" value={formatPercent(success.onTimeRate)} icon={<Hourglass size={15} />} hint={`v rozpočtu hodin ${formatPercent(success.onBudgetRate)}`} />
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl border border-line bg-surface" />}>
        <ProjectsExplorer />
      </Suspense>
    </div>
  );
}
