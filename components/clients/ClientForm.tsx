"use client";

import { Plus, Star, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveClientAction } from "@/app/actions/clients";
import { Checkbox, Field, FormMessage, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { CLIENT_SOURCES, CLIENT_STATUS, COMPANY_SIZE, PRIORITY, TIMELINE } from "@/lib/status";
import type { Client, ContactPerson, PublicUser } from "@/lib/types";

const emptyContact = (): ContactPerson => ({
  id: "",
  name: "",
  role: "",
  email: "",
  phone: "",
  linkedin: "",
  isDecisionMaker: false,
  note: "",
});

const SECTIONS = [
  ["firma", "Firma"],
  ["vztah", "Vztah"],
  ["kontakty", "Kontakty"],
  ["kvalifikace", "Kvalifikace"],
  ["digital", "Digitální stav"],
  ["fakturace", "Fakturace"],
  ["poznamky", "Poznámky"],
] as const;

export function ClientForm({ client, users, meId }: { client?: Client; users: PublicUser[]; meId: string }) {
  const [state, action] = useActionState(saveClientAction, undefined);
  const [contacts, setContacts] = useState<ContactPerson[]>(client?.contacts.length ? client.contacts : [emptyContact()]);
  const [fit, setFit] = useState(client?.qualification.fit ?? 0);
  const c = client;
  const q = c?.qualification;
  const d = c?.digital;

  const update = (i: number, patch: Partial<ContactPerson>) =>
    setContacts((list) => list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  return (
    <form action={action} className="relative">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <input type="hidden" name="contacts" value={JSON.stringify(contacts)} />
      <input type="hidden" name="fit" value={fit} />

      <nav className="sticky top-14 z-10 -mx-4 mb-2 flex gap-1 overflow-x-auto border-b border-line bg-bg/90 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0" aria-label="Sekce formuláře">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg">
            {label}
          </a>
        ))}
      </nav>

      <div className="rounded-xl border border-line bg-surface px-5 shadow-card">
        <FormSection id="firma" title="Firma" description="Základní identifikace klienta.">
          <Field label="Název firmy / klienta" htmlFor="company" required className="sm:col-span-2">
            <TextInput id="company" name="company" defaultValue={c?.company} required autoFocus={!c} placeholder="např. Kavárna Mlýnek s.r.o." />
          </Field>
          <Field label="IČO" htmlFor="ico">
            <TextInput id="ico" name="ico" defaultValue={c?.ico} inputMode="numeric" />
          </Field>
          <Field label="DIČ" htmlFor="dic">
            <TextInput id="dic" name="dic" defaultValue={c?.dic} placeholder="CZ…" />
          </Field>
          <Field label="Odvětví" htmlFor="industry">
            <TextInput id="industry" name="industry" defaultValue={c?.industry} placeholder="např. Gastronomie, SaaS, Reality" />
          </Field>
          <Field label="Velikost firmy" htmlFor="size">
            <SelectInput id="size" name="size" defaultValue={c?.size ?? ""} options={Object.entries(COMPANY_SIZE).map(([value, label]) => ({ value, label }))} />
          </Field>
          <Field label="Roční obrat (odhad, Kč)" htmlFor="annualRevenue">
            <TextInput id="annualRevenue" name="annualRevenue" inputMode="numeric" defaultValue={c?.annualRevenue ?? ""} />
          </Field>
          <Field label="Web" htmlFor="website">
            <TextInput id="website" name="website" defaultValue={c?.website} placeholder="firma.cz" />
          </Field>
          <Field label="Ulice a č. p." htmlFor="street">
            <TextInput id="street" name="street" defaultValue={c?.street} />
          </Field>
          <Field label="Město" htmlFor="city">
            <TextInput id="city" name="city" defaultValue={c?.city} />
          </Field>
          <Field label="PSČ" htmlFor="zip">
            <TextInput id="zip" name="zip" defaultValue={c?.zip} />
          </Field>
          <Field label="Země" htmlFor="country">
            <TextInput id="country" name="country" defaultValue={c?.country ?? "Česko"} />
          </Field>
        </FormSection>

        <FormSection id="vztah" title="Vztah" description="Kde ve vztahu jsme a kdo za klienta odpovídá.">
          <Field label="Stav vztahu" htmlFor="status">
            <SelectInput
              id="status"
              name="status"
              defaultValue={c?.status ?? "lead"}
              options={Object.entries(CLIENT_STATUS).map(([value, m]) => ({ value, label: m.label }))}
            />
          </Field>
          <Field label="Priorita" htmlFor="priority">
            <SelectInput id="priority" name="priority" defaultValue={c?.priority ?? "B"} options={Object.entries(PRIORITY).map(([value, m]) => ({ value, label: m.label }))} />
          </Field>
          <Field label="Account owner" htmlFor="ownerId" hint="Kdo z nás má klienta na starosti.">
            <SelectInput id="ownerId" name="ownerId" defaultValue={c?.ownerId ?? meId} options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Field>
          <Field label="Zdroj" htmlFor="source">
            <TextInput id="source" name="source" list="sources" defaultValue={c?.source} placeholder="Odkud klient přišel" />
            <datalist id="sources">
              {CLIENT_SOURCES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="V kontaktu od" htmlFor="since">
            <TextInput id="since" name="since" type="date" defaultValue={c?.since} />
          </Field>
          <Field label="Štítky" htmlFor="tags" hint="Oddělte čárkou, např. VIP, Doporučuje nás">
            <TextInput id="tags" name="tags" defaultValue={c?.tags.join(", ")} />
          </Field>
        </FormSection>

        <FormSection id="kontakty" title="Kontaktní osoby" description="Všichni lidé na straně klienta. Označte rozhodovatele.">
          <div className="space-y-3 sm:col-span-2">
            {contacts.map((p, i) => (
              <div key={i} className="rounded-lg border border-line bg-surface-2/40 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-2">
                    <UserRound size={13} /> Kontakt {i + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      label="Rozhoduje"
                      checked={p.isDecisionMaker}
                      onChange={(e) => update(i, { isDecisionMaker: e.target.checked })}
                    />
                    <button
                      type="button"
                      onClick={() => setContacts((list) => list.filter((_, idx) => idx !== i))}
                      className="rounded-md p-1 text-muted hover:bg-red-500/10 hover:text-red-600"
                      aria-label={`Odebrat kontakt ${i + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextInput aria-label="Jméno" placeholder="Jméno a příjmení" value={p.name} onChange={(e) => update(i, { name: e.target.value })} />
                  <TextInput aria-label="Role" placeholder="Pozice / role" value={p.role} onChange={(e) => update(i, { role: e.target.value })} />
                  <TextInput aria-label="E-mail" type="email" placeholder="E-mail" value={p.email} onChange={(e) => update(i, { email: e.target.value })} />
                  <TextInput aria-label="Telefon" type="tel" placeholder="Telefon" value={p.phone} onChange={(e) => update(i, { phone: e.target.value })} />
                  <TextInput
                    aria-label="LinkedIn"
                    placeholder="LinkedIn URL"
                    value={p.linkedin}
                    onChange={(e) => update(i, { linkedin: e.target.value })}
                    className="sm:col-span-2"
                  />
                  <TextArea
                    aria-label="Poznámka ke kontaktu"
                    rows={2}
                    placeholder="Povaha, co ho zajímá, jak s ním mluvit…"
                    value={p.note}
                    onChange={(e) => update(i, { note: e.target.value })}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setContacts((list) => [...list, emptyContact()])}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 text-xs font-medium text-fg-2 hover:border-accent hover:text-accent"
            >
              <Plus size={14} /> Přidat kontaktní osobu
            </button>
          </div>
        </FormSection>

        <FormSection id="kvalifikace" title="Obchodní kvalifikace" description="Rozpočet, potřeby, rozhodování a konkurence. Z toho se počítá lead score.">
          <Field label="Rozpočet od (Kč)" htmlFor="budgetMin">
            <TextInput id="budgetMin" name="budgetMin" inputMode="numeric" defaultValue={q?.budgetMin ?? ""} />
          </Field>
          <Field label="Rozpočet do (Kč)" htmlFor="budgetMax">
            <TextInput id="budgetMax" name="budgetMax" inputMode="numeric" defaultValue={q?.budgetMax ?? ""} />
          </Field>
          <Field label="Časový horizont" htmlFor="timeline">
            <SelectInput id="timeline" name="timeline" defaultValue={q?.timeline ?? ""} options={Object.entries(TIMELINE).map(([value, label]) => ({ value, label }))} />
          </Field>
          <Field label="Shoda s naším ideálním klientem" htmlFor="fit-1">
            <div className="flex h-9 items-center gap-1" role="radiogroup" aria-label="Fit 1 až 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  id={`fit-${n}`}
                  type="button"
                  role="radio"
                  aria-checked={fit === n}
                  onClick={() => setFit(fit === n ? 0 : n)}
                  className="rounded p-0.5"
                  aria-label={`${n} z 5`}
                >
                  <Star size={20} className={cn(n <= fit ? "fill-amber-400 text-amber-400" : "text-line-strong")} />
                </button>
              ))}
              <span className="ml-2 text-xs text-muted">{fit ? `${fit} / 5` : "nehodnoceno"}</span>
            </div>
          </Field>
          <Field label="Co potřebují" htmlFor="needs" className="sm:col-span-2">
            <TextArea id="needs" name="needs" defaultValue={q?.needs} placeholder="Nový web, e-shop, redesign, rezervační systém…" />
          </Field>
          <Field label="Bolesti a problémy" htmlFor="painPoints" className="sm:col-span-2">
            <TextArea id="painPoints" name="painPoints" defaultValue={q?.painPoints} placeholder="Co je dnes trápí, proč řeší změnu teď" />
          </Field>
          <Field label="Jak rozhodují" htmlFor="decisionProcess" className="sm:col-span-2">
            <TextArea id="decisionProcess" name="decisionProcess" defaultValue={q?.decisionProcess} placeholder="Kdo schvaluje, kolik lidí do toho mluví, výběrové řízení…" />
          </Field>
          <Field label="Konkurence" htmlFor="competitors">
            <TextInput id="competitors" name="competitors" defaultValue={q?.competitors} placeholder="Jiné agentury / freelanceři ve hře" />
          </Field>
          <Field label="Proč my" htmlFor="whyUs">
            <TextInput id="whyUs" name="whyUs" defaultValue={q?.whyUs} placeholder="Náš argument pro výhru" />
          </Field>
        </FormSection>

        <FormSection id="digital" title="Digitální stav" description="Současný web, sítě a cíle klienta.">
          <Field label="Současný web" htmlFor="currentWebsite">
            <TextInput id="currentWebsite" name="currentWebsite" defaultValue={d?.currentWebsite} />
          </Field>
          <Field label="Platforma" htmlFor="platform">
            <TextInput id="platform" name="platform" defaultValue={d?.platform} placeholder="WordPress, Shoptet, Webflow…" list="platforms" />
            <datalist id="platforms">
              {["WordPress", "Shoptet", "Webflow", "Wix", "Shopify", "WooCommerce", "Custom", "Žádný"].map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          <Field label="Stáří webu" htmlFor="websiteAge">
            <TextInput id="websiteAge" name="websiteAge" defaultValue={d?.websiteAge} placeholder="např. 5 let" />
          </Field>
          <Field label="Instagram" htmlFor="instagram">
            <TextInput id="instagram" name="instagram" defaultValue={d?.instagram} />
          </Field>
          <Field label="Facebook" htmlFor="facebook">
            <TextInput id="facebook" name="facebook" defaultValue={d?.facebook} />
          </Field>
          <Field label="LinkedIn firmy" htmlFor="linkedinCompany">
            <TextInput id="linkedinCompany" name="linkedinCompany" defaultValue={d?.linkedin} />
          </Field>
          <Field label="Cíle klienta" htmlFor="goals" className="sm:col-span-2">
            <TextArea id="goals" name="goals" defaultValue={d?.goals} placeholder="Víc poptávek, vyšší konverze e-shopu, nábor, nový brand…" />
          </Field>
          <Field label="Měřitelné KPI" htmlFor="kpis" className="sm:col-span-2">
            <TextArea id="kpis" name="kpis" defaultValue={d?.kpis} rows={2} placeholder="např. 30 poptávek měsíčně, konverze 2 %" />
          </Field>
        </FormSection>

        <FormSection id="fakturace" title="Fakturace & retainer" description="Opakovaný příjem (správa, SLA) se započítává do MRR.">
          <Field label="Fakturační e-mail" htmlFor="billingEmail">
            <TextInput id="billingEmail" name="billingEmail" type="email" defaultValue={c?.billingEmail} />
          </Field>
          <Field label="Splatnost faktur (dny)" htmlFor="paymentTermsDays">
            <TextInput id="paymentTermsDays" name="paymentTermsDays" inputMode="numeric" defaultValue={c?.paymentTermsDays ?? 14} />
          </Field>
          <Field label="Retainer měsíčně (Kč)" htmlFor="retainerMonthly" hint="0 = bez retaineru">
            <TextInput id="retainerMonthly" name="retainerMonthly" inputMode="numeric" defaultValue={c?.retainer?.monthly ?? ""} />
          </Field>
          <Field label="Rozsah retaineru" htmlFor="retainerScope">
            <TextInput id="retainerScope" name="retainerScope" defaultValue={c?.retainer?.scope} placeholder="Správa, hosting, x hodin vývoje…" />
          </Field>
          <Field label="Retainer od" htmlFor="retainerSince">
            <TextInput id="retainerSince" name="retainerSince" type="date" defaultValue={c?.retainer?.since} />
          </Field>
          <Field label="Retainer do" htmlFor="retainerUntil" hint="Prázdné = na dobu neurčitou">
            <TextInput id="retainerUntil" name="retainerUntil" type="date" defaultValue={c?.retainer?.until} />
          </Field>
        </FormSection>

        <FormSection id="poznamky" title="Poznámky" description="Jen pro náš tým.">
          <Field label="Osobnost a styl komunikace" htmlFor="personality" className="sm:col-span-2">
            <TextArea id="personality" name="personality" rows={4} defaultValue={c?.personality} placeholder="Jak s klientem jednat, co ocení, na co si dát pozor…" />
          </Field>
          <Field label="Interní poznámky" htmlFor="notes" className="sm:col-span-2">
            <TextArea id="notes" name="notes" rows={4} defaultValue={c?.notes} />
          </Field>
        </FormSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        <div className="mr-auto min-w-0">
          <FormMessage state={state} />
        </div>
        <Link
          href={c ? `/clients/${c.id}` : "/clients"}
          className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-fg-2 hover:bg-surface-2 hover:text-fg"
        >
          Zrušit
        </Link>
        <SubmitButton>{c ? "Uložit změny" : "Vytvořit klienta"}</SubmitButton>
      </div>
    </form>
  );
}
