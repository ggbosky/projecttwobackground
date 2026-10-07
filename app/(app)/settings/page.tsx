import { Database, KeyRound, SlidersHorizontal, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { AgencySettingsForm, PasswordForm, ProfileForm } from "@/components/team/SettingsForms";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Nastavení" };

export default async function SettingsPage() {
  const { me, ctx } = await getData();
  return (
    <div className="animate-in max-w-4xl">
      <PageHeader eyebrow="Účet" title="Nastavení" description="Tvůj profil, heslo a společné cíle agentury." />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Můj profil" icon={<UserRound size={15} />} />
          <CardBody>
            <ProfileForm me={me} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Změna hesla" icon={<KeyRound size={15} />} />
          <CardBody>
            <PasswordForm />
          </CardBody>
        </Card>
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
              Všechna data (klienti, projekty, faktury, účty) jsou uložená v jednom souboru{" "}
              <code className="rounded bg-surface-3 px-1 font-mono text-xs">.data/db.json</code> na serveru, kde aplikace běží. Nikam jinam se
              neposílají a nejsou součástí GitHub repozitáře.
            </p>
            <p className="text-xs text-muted">
              Zálohu uděláte zkopírováním tohoto souboru. Hesla jsou uložená jen jako hash (scrypt). Aktuálně: {ctx.clients.length} klientů,{" "}
              {ctx.projects.length} projektů, {ctx.invoices.length} faktur, {ctx.users.length} účtů.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
