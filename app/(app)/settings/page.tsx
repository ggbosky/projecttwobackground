import { Database, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { AgencySettingsForm } from "@/components/team/SettingsForms";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getData } from "@/lib/server/context";

export const metadata: Metadata = { title: "Nastavení" };

export default async function SettingsPage() {
  const { ctx } = await getData();
  return (
    <div className="animate-in max-w-4xl">
      <PageHeader eyebrow="Workspace" title="Nastavení" description="Společné cíle agentury a informace o uložených datech. Členy týmu upravíte v sekci Tým." />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Cíle agentury" description="Společné pro celý tým" icon={<SlidersHorizontal size={15} />} />
          <CardBody>
            <AgencySettingsForm settings={ctx.settings} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Kde jsou data" icon={<Database size={15} />} />
          <CardBody className="space-y-2 text-sm text-fg-2">
            <p>
              Aplikace je otevřená bez přihlašování. Všechna data jsou uložená v souboru{" "}
              <code className="rounded bg-surface-3 px-1 font-mono text-xs">.data/db.json</code> na serveru, kde aplikace běží, a nikam jinam se
              neposílají.
            </p>
            <p className="text-xs text-muted">
              Aktuálně: {ctx.clients.length} klientů, {ctx.projects.length} projektů, {ctx.invoices.length} faktur, {ctx.users.length} členů týmu.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
