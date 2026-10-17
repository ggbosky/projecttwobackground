"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { addFinishedClientAction } from "@/app/actions/clients";
import { Field, FormMessage, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { formatCZK } from "@/lib/format";
import { CARE_PACKAGES, WEB_PACKAGES } from "@/lib/agency";
import { CLIENT_SOURCES, WEB_TYPE, WEB_TYPE_ORDER } from "@/lib/status";

type PayMode = "once" | "monthly" | "both";

const MODES: { value: PayMode; label: string; hint: string }[] = [
  { value: "once", label: "Jednorázová platba", hint: "Web, e-shop, redesign…" },
  { value: "monthly", label: "Měsíční paušál", hint: "Péče o web, správa" },
  { value: "both", label: "Jednorázově + měsíčně", hint: "Web a k tomu péče" },
];

function Chip({ on, onClick, children, id }: { on: boolean; onClick: () => void; children: ReactNode; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
        on ? "border-accent/50 bg-accent-soft text-fg ring-1 ring-accent/30" : "border-line text-fg-2 hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

const toNum = (v: string) => Number(v.replace(/\s/g, "").replace(",", ".")) || 0;

/** Přidání klienta, pro kterého už máme hotovo – co jsme dělali a kolik jsme za to dostali */
export function FinishedClientForm() {
  const [state, action] = useActionState(addFinishedClientAction, undefined);
  const [mode, setMode] = useState<PayMode>("once");
  const [paidState, setPaidState] = useState<"paid" | "pending">("paid");
  const [amount, setAmount] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [monthsPaid, setMonthsPaid] = useState("");
  const [rating, setRating] = useState(0);
  const today = new Date().toISOString().slice(0, 10);

  const once = mode !== "monthly";
  const monthly = mode !== "once";
  const received = (once && paidState === "paid" ? toNum(amount) : 0) + (monthly ? toNum(monthlyAmount) * Math.round(toNum(monthsPaid)) : 0);
  const waiting = once && paidState === "pending" ? toNum(amount) : 0;

  return (
    <form action={action}>
      <input type="hidden" name="payMode" value={mode} />
      <input type="hidden" name="paidState" value={paidState} />
      <input type="hidden" name="rating" value={rating || ""} />

      <div className="rounded-xl border border-line bg-surface px-5 shadow-card">
        <FormSection title="Klient" description="Pro koho jsme to dělali.">
          <Field label="Jméno klienta / firmy" htmlFor="company" required className="sm:col-span-2">
            <TextInput id="company" name="company" required autoFocus placeholder="např. Kavárna Mlýnek nebo Jan Novák" />
          </Field>
          <Field label="Kontaktní osoba" htmlFor="contactName">
            <TextInput id="contactName" name="contactName" />
          </Field>
          <Field label="E-mail" htmlFor="contactEmail">
            <TextInput id="contactEmail" name="contactEmail" type="email" />
          </Field>
          <Field label="Telefon" htmlFor="contactPhone">
            <TextInput id="contactPhone" name="contactPhone" type="tel" />
          </Field>
          <Field label="Web klienta" htmlFor="website">
            <TextInput id="website" name="website" placeholder="firma.cz" />
          </Field>
          <Field label="Obor" htmlFor="industry">
            <TextInput id="industry" name="industry" placeholder="např. Gastronomie, Řemeslo, Reality" />
          </Field>
          <Field label="IČO" htmlFor="ico">
            <TextInput id="ico" name="ico" inputMode="numeric" />
          </Field>
          <Field label="Město" htmlFor="city">
            <TextInput id="city" name="city" />
          </Field>
          <Field label="Odkud přišel" htmlFor="source">
            <TextInput id="source" name="source" list="finished-sources" placeholder="Doporučení, web, Instagram…" />
            <datalist id="finished-sources">
              {CLIENT_SOURCES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Spolupráce" htmlFor="status" className="sm:col-span-2">
            <SelectInput
              id="status"
              name="status"
              defaultValue="active"
              options={[
                { value: "active", label: "Pořád spolupracujeme (aktivní klient)" },
                { value: "former", label: "Hotovo, dál nespolupracujeme (bývalý klient)" },
              ]}
            />
          </Field>
        </FormSection>

        <FormSection title="Kolik jsme dostali" description="Uloží se jako platba, takže se hned propíše do obratu a financí.">
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3" role="group" aria-label="Typ platby">
            {MODES.map((m) => (
              <Chip key={m.value} id={`mode-${m.value}`} on={mode === m.value} onClick={() => setMode(m.value)}>
                <span className="block font-medium">{m.label}</span>
                <span className="block text-[11px] text-muted">{m.hint}</span>
              </Chip>
            ))}
          </div>

          {once && (
            <>
              <Field label="Částka za zakázku (Kč)" htmlFor="amount" required hint="Kolik jsme za to dostali / vyfakturovali">
                <TextInput id="amount" name="amount" inputMode="numeric" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="např. 25000" />
              </Field>
              <Field label="Zaplaceno?" htmlFor="paid-yes">
                <div className="grid h-9 grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
                  {(
                    [
                      ["paid", "Ano, zaplaceno"],
                      ["pending", "Ještě ne"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      id={v === "paid" ? "paid-yes" : "paid-no"}
                      type="button"
                      aria-pressed={paidState === v}
                      onClick={() => setPaidState(v)}
                      className={cn("rounded-md text-xs font-medium transition-all", paidState === v ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {monthly && (
            <>
              <Field label="Měsíčně (Kč)" htmlFor="monthlyAmount" required>
                <TextInput id="monthlyAmount" name="monthlyAmount" inputMode="numeric" required value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} placeholder="např. 1500" />
              </Field>
              <Field label="Platí od" htmlFor="monthlySince">
                <TextInput id="monthlySince" name="monthlySince" type="date" defaultValue={today} />
              </Field>
              <Field label="Balíček péče" htmlFor="careScope">
                <TextInput id="careScope" name="careScope" list="finished-care" placeholder="Basic, Standard, Plus…" />
                <datalist id="finished-care">
                  {CARE_PACKAGES.map((p) => (
                    <option key={p.name} value={`${p.name} – ${p.description}`} />
                  ))}
                </datalist>
              </Field>
              <Field label="Kolik měsíců už zaplatili" htmlFor="monthsPaid" hint="Započítá se do obratu">
                <TextInput id="monthsPaid" name="monthsPaid" inputMode="numeric" value={monthsPaid} onChange={(e) => setMonthsPaid(e.target.value)} placeholder="0" />
              </Field>
            </>
          )}

          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-lg border border-line bg-surface-2 px-3 py-2.5 sm:col-span-2">
            <span className="text-xs text-muted">
              Dostali jsme celkem <span className="tabular text-base font-semibold text-fg">{formatCZK(received)}</span>
            </span>
            {waiting > 0 && (
              <span className="text-xs text-muted">
                čeká na zaplacení <span className="tabular font-semibold text-amber-600 dark:text-amber-400">{formatCZK(waiting)}</span>
              </span>
            )}
            {monthly && toNum(monthlyAmount) > 0 && (
              <span className="text-xs text-muted">
                + <span className="tabular font-semibold text-fg">{formatCZK(toNum(monthlyAmount))}</span> každý měsíc
              </span>
            )}
          </div>
        </FormSection>

        {once && (
          <FormSection title="Co jsme dělali" description="Uloží se jako hotový projekt – pro přehled, úspěšnost a reference.">
            <Field label="Název zakázky" htmlFor="projectName" className="sm:col-span-2">
              <TextInput id="projectName" name="projectName" placeholder="např. Nový web s rezervacemi" />
            </Field>
            <Field label="Typ webu" htmlFor="type">
              <SelectInput id="type" name="type" defaultValue="presentation" options={WEB_TYPE_ORDER.map((t) => ({ value: t, label: WEB_TYPE[t].label }))} />
            </Field>
            <Field label="Balíček" htmlFor="package">
              <SelectInput
                id="package"
                name="package"
                defaultValue=""
                options={[{ value: "", label: "— neurčeno —" }, ...WEB_PACKAGES.map((w) => ({ value: w.name, label: w.name })), { value: "Na míru", label: "Na míru" }]}
              />
            </Field>
            <Field label="Začátek" htmlFor="startDate">
              <TextInput id="startDate" name="startDate" type="date" />
            </Field>
            <Field label="Dokončeno" htmlFor="finishedDate" hint="Datum předání / zaplacení">
              <TextInput id="finishedDate" name="finishedDate" type="date" defaultValue={today} />
            </Field>
            <Field label="Odpracováno hodin" htmlFor="hours" hint="Nepovinné – pro výpočet hodinovky">
              <TextInput id="hours" name="hours" inputMode="numeric" />
            </Field>
            <Field label="Technologie" htmlFor="stack" hint="Oddělte čárkou">
              <TextInput id="stack" name="stack" placeholder="WordPress, Webflow, Shopify…" />
            </Field>
            <Field label="Popis" htmlFor="description" className="sm:col-span-2">
              <TextArea id="description" name="description" rows={2} placeholder="Co přesně jsme dodali" />
            </Field>
            <Field label="Spokojenost klienta" htmlFor="rating-1">
              <div className="flex h-9 items-center gap-1" role="radiogroup" aria-label="Hodnocení 1 až 5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} id={`rating-${n}`} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(rating === n ? 0 : n)} aria-label={`${n} z 5`}>
                    <Star size={20} className={cn(n <= rating ? "fill-amber-400 text-amber-400" : "text-line-strong")} />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Zpětná vazba / recenze" htmlFor="feedback">
              <TextInput id="feedback" name="feedback" />
            </Field>
          </FormSection>
        )}

        <FormSection title="Poznámka" description="Jen pro náš tým.">
          <Field label="Interní poznámka" htmlFor="notes" className="sm:col-span-2">
            <TextArea id="notes" name="notes" rows={2} />
          </Field>
        </FormSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        <div className="mr-auto min-w-0">
          <FormMessage state={state} />
        </div>
        <Link href="/clients" className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-fg-2 hover:bg-surface-2 hover:text-fg">
          Zrušit
        </Link>
        <SubmitButton>Uložit klienta</SubmitButton>
      </div>
    </form>
  );
}
