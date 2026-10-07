import { CalendarDays, Clock } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/Avatar";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Stars } from "@/components/ui/Stars";
import { formatCZK, formatDateShort, formatHours } from "@/lib/format";
import { WEB_TYPE } from "@/lib/status";
import type { Project, PublicUser } from "@/lib/types";

export function ProjectCard({ project, clientName, users }: { project: Project; clientName?: string; users: PublicUser[] }) {
  const members = project.team.map((a) => users.find((u) => u.id === a.memberId)).filter(Boolean) as PublicUser[];
  const done = ["completed", "cancelled", "lost"].includes(project.status);
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg group-hover:text-accent">{project.name}</p>
          <p className="truncate text-xs text-muted">
            {clientName ? `${clientName} · ` : ""}
            {WEB_TYPE[project.type].label}
          </p>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>
      {project.description && <p className="mt-2 line-clamp-2 text-xs text-fg-2">{project.description}</p>}
      {(project.status === "in_progress" || project.status === "on_hold") && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-muted">
            <span>Postup</span>
            <span className="tabular">{project.progress} %</span>
          </div>
          <Progress value={project.progress} max={100} tone={project.status === "on_hold" ? "warn" : "accent"} />
        </div>
      )}
      {project.status === "completed" && project.rating && (
        <div className="mt-3">
          <Stars value={project.rating} size={12} />
        </div>
      )}
      <div className="min-h-4 flex-1" />
      <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-xs">
        <span className="tabular font-medium text-fg">{formatCZK(project.price)}</span>
        <span className="inline-flex items-center gap-1 text-muted">
          {done ? <Clock size={12} /> : <CalendarDays size={12} />}
          {done ? formatHours(project.actualHours) : project.plannedEndDate ? formatDateShort(project.plannedEndDate) : "bez termínu"}
        </span>
        {members.length > 0 && <AvatarStack members={members} max={3} size="xs" />}
      </div>
    </Link>
  );
}
