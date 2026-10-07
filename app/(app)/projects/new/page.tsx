import type { Metadata } from "next";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Nový projekt" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { ctx } = await getData();
  const { client } = await searchParams;
  return (
    <div className="animate-in">
      <PageHeader eyebrow="Zakázky" title="Nový projekt" description="Nabídka, rozběhnutá zakázka nebo už hotový projekt pro historii." />
      <ProjectForm clients={ctx.clients.map((c) => ({ id: c.id, name: c.company }))} users={ctx.users} defaultClientId={client} />
    </div>
  );
}
