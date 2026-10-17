import { CheckCircle2, ExternalLink, HelpCircle, Mail, Quote, Sparkles, Star } from "lucide-react";
import type { Metadata } from "next";
import { ImportReferences } from "@/components/agency/ImportReferences";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { AGENCY, CARE_PACKAGES, FAQ, PROCESS, REFERENCES, SERVICES, WEB_PACKAGES, type PackageInfo } from "@/lib/agency";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { getData } from "@/lib/server/context";

export const metadata: Metadata = { title: "Agentura" };

export default async function AgencyPage() {
  const { ctx } = await getData();
  const countBy = (pkg: string) => ctx.projects.filter((p) => p.package === pkg).length;
  const careCount = (pkg: string) => ctx.clients.filter((c) => c.retainer?.scope?.startsWith(pkg)).length;

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow={`Převzato z projectwo.com · ${formatDate(AGENCY.syncedAt)}`}
        title="Project Two"
        description={AGENCY.intro}
        actions={
          <a
            href={AGENCY.web}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg hover:border-line-strong"
          >
            Otevřít web <ExternalLink size={14} />
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {AGENCY.stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
            <p className="text-lg font-semibold tracking-tight text-fg">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Služby" description="Co nabízíme na webu" icon={<Sparkles size={15} />} />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <div key={s.title} className="rounded-lg border border-line bg-surface-2/40 p-3">
                  <p className="text-sm font-medium text-fg">{s.title}</p>
                  <p className="mt-0.5 text-xs text-fg-2">{s.text}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Kontakt a provozovatel" icon={<Mail size={15} />} />
          <CardBody className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] text-muted">E-mail</p>
              <p className="text-fg">{AGENCY.email}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Web</p>
              <a href={AGENCY.web} target="_blank" rel="noreferrer" className="text-fg hover:text-accent">
                projectwo.com
              </a>
            </div>
            <div>
              <p className="text-[11px] text-muted">Provozovatel</p>
              <p className="text-fg">{AGENCY.operator.name}</p>
              <p className="text-xs text-fg-2">IČO {AGENCY.operator.ico}</p>
              <p className="text-xs text-fg-2">{AGENCY.operator.address}</p>
            </div>
            <p className="border-t border-line pt-3 text-xs text-muted">{AGENCY.tagline}</p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Packages title="Balíčky webů" description="Cena se určuje individuálně podle rozsahu" items={WEB_PACKAGES} count={countBy} unit="projektů" />
        <Packages title="Péče o web" description="Měsíční retainer po spuštění" items={CARE_PACKAGES} count={careCount} unit="klientů" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Postup spolupráce" description="Jak to klientům vysvětlujeme na webu" />
        <CardBody>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {PROCESS.map((p, i) => (
              <li key={p.title} className="rounded-lg border border-line bg-surface-2/40 p-3">
                <p className="font-mono text-xs text-accent">0{i + 1}</p>
                <p className="mt-1 text-sm font-medium text-fg">{p.title}</p>
                <p className="mt-0.5 text-xs text-fg-2">{p.text}</p>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Reference a recenze" description="Weby uvedené na projectwo.com – můžete je přidat jako klienty do CRM" icon={<Star size={15} />} />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {REFERENCES.map((r) => (
              <figure key={r.key} className="flex flex-col rounded-lg border border-line bg-surface-2/40 p-4">
                <Quote size={16} className="text-muted" />
                <blockquote className="mt-2 flex-1 text-sm text-fg italic">„{r.quote}“</blockquote>
                <figcaption className="mt-3 text-xs">
                  <p className="font-medium text-fg">{r.contact}</p>
                  <p className="text-muted">{r.role}</p>
                  <a href={`https://${r.website}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-accent hover:underline">
                    {r.website} <ExternalLink size={11} />
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="border-t border-line pt-4">
            <p className="mb-2 text-xs font-medium text-fg-2">Přidat reference do CRM jako klienty</p>
            <ImportReferences existing={ctx.clients.map((c) => c.website)} />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Časté dotazy" description="Odpovědi z webu – hodí se při telefonátu s klientem" icon={<HelpCircle size={15} />} />
        <CardBody>
          <div className="divide-y divide-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-fg marker:hidden">
                  <span className="mr-2 inline-block text-muted transition-transform group-open:rotate-90">›</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-4 text-sm text-fg-2">{f.a}</p>
              </details>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Packages({
  title,
  description,
  items,
  count,
  unit,
}: {
  title: string;
  description: string;
  items: readonly PackageInfo[];
  count: (name: string) => number;
  unit: string;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map((p) => (
            <div key={p.name} className={cn("flex flex-col rounded-lg border p-3", p.highlighted ? "border-accent/40 bg-accent-soft" : "border-line bg-surface-2/40")}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-fg">{p.name}</p>
                {p.highlighted && <span className="text-[10px] font-medium text-accent">nejoblíbenější</span>}
              </div>
              <p className="mt-0.5 text-[11px] text-muted">{p.description}</p>
              <ul className="mt-3 flex-1 space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-fg-2">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-2 text-[11px] text-muted">
                V CRM: {count(p.name)} {unit}
              </p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
