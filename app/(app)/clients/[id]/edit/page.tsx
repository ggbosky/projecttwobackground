import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/ClientForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Upravit klienta" };

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, ctx } = await getData();
  const client = ctx.clients.find((c) => c.id === id);
  if (!client) notFound();
  return (
    <div className="animate-in">
      <PageHeader eyebrow="CRM" title={`Upravit: ${client.company}`} />
      <ClientForm client={client} users={ctx.users} meId={me.id} />
    </div>
  );
}
