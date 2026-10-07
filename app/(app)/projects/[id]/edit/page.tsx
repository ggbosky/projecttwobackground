import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Upravit projekt" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx } = await getData();
  const project = ctx.projects.find((p) => p.id === id);
  if (!project) notFound();
  return (
    <div className="animate-in">
      <PageHeader eyebrow="Zakázky" title={`Upravit: ${project.name}`} />
      <ProjectForm project={project} clients={ctx.clients.map((c) => ({ id: c.id, name: c.company }))} users={ctx.users} />
    </div>
  );
}
