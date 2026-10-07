import type { Metadata } from "next";
import { ClientForm } from "@/components/clients/ClientForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Nový klient" };

export default async function NewClientPage() {
  const { me, ctx } = await getData();
  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="CRM"
        title="Nový klient"
        description="Vyplňte, co víte – povinný je jen název. Čím víc údajů, tím přesnější analýza a lead score."
      />
      <ClientForm users={ctx.users} meId={me.id} />
    </div>
  );
}
