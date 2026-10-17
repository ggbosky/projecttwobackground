import type { Metadata } from "next";
import Link from "next/link";
import { ClientForm } from "@/components/clients/ClientForm";
import { FinishedClientForm } from "@/components/clients/FinishedClientForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getData } from "@/lib/server/context";

export const metadata: Metadata = { title: "Přidat klienta" };

export default async function NewClientPage({ searchParams }: { searchParams: Promise<{ typ?: string }> }) {
  const { typ } = await searchParams;
  const { me, ctx } = await getData();

  if (typ === "lead") {
    return (
      <div className="animate-in">
        <PageHeader
          eyebrow="CRM"
          title="Potenciální klient (lead)"
          description="Někdo, s kým teprve jednáme. Čím víc údajů, tím přesnější analýza a lead score."
          actions={
            <Link href="/clients/new" className="text-sm font-medium text-accent hover:underline">
              ← Přidat hotového klienta
            </Link>
          }
        />
        <ClientForm users={ctx.users} meId={me?.id ?? ""} />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="CRM"
        title="Přidat hotového klienta"
        description="Klient, pro kterého už máme hotovo: co jsme dělali a kolik jsme za to dostali. Uloží se klient, hotový projekt i platba."
        actions={
          <Link href="/clients/new?typ=lead" className="text-sm font-medium text-muted hover:text-accent">
            Jen potenciální klient (lead) →
          </Link>
        }
      />
      <FinishedClientForm />
    </div>
  );
}
