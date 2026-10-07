"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProjectAction } from "@/app/actions/projects";
import { Avatar } from "@/components/ui/Avatar";
import { Field, FormMessage, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { OUTCOME_REASONS_NEGATIVE, OUTCOME_REASONS_POSITIVE, PROJECT_STATUS, PROJECT_STATUS_ORDER, WEB_TYPE, WEB_TYPE_ORDER } from "@/lib/status";
import type { Project, ProjectStatus, PublicUser } from "@/lib/types";

export function ProjectForm({
  project,
  clients,
  users,
  defaultClientId,
}: {
  project?: Project;
  clients: { id: string; name: string }[];
  users: PublicUser[];
  defaultClientId?: string;
}) {
  const [state, action] = useActionState(saveProjectAction, undefined);
  const p = project;
  const [status, setStatus] = useState<ProjectStatus>(p?.status ?? "proposal");
  const [rating, setRating] = useState(p?.rating ?? 0);
  const [team, setTeam] = useState<Record<string, number>>(() =>
    Object.fromEntries(users.map((u) => [u.id, p?.team.find((a) => a.memberId === u.id)?.hoursPerWeek ?? 0])),
  );
  const [reasons, setReasons] = useState<string[]>(p?.outcomeReasons ?? []);
  const [customReason, setCustomReason] = useState("");

  const closed = status === "completed" || status === "cancelled" || status === "lost";
  const reasonOptions = status === "completed" ? OUTCOME_REASONS_POSITIVE : OUTCOME_REASONS_NEGATIVE;
  const allReasons = [...new Set([...reasonOptions, ...reasons])];

  if (!clients.length) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <p className="text-sm text-fg">Projekt musí patřit klientovi.</p>
        <Link href="/clients/new" className="mt-3 inline-flex h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg">
          Nejdřív přidat klienta
        </Link>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <input type="hidden" name="team" value={JSON.stringify(Object.entries(team).map(([memberId, hoursPerWeek]) => ({ memberId, hoursPerWeek })).filter((a) => a.hoursPerWeek > 0))} />
      <input type="hidden" name="rating" value={rating || ""} />
      <input type="hidden" name="outcomeReasons" value={reasons.join(",")} />

      <div className="rounded-xl border border-line bg-surface px-5 shadow-card">
        <FormSection title="Zakázka" description="Co děláme a pro koho.">
          <Field label="Název projektu" htmlFor="name" required className="sm:col-span-2">
            <TextInput id="name" name="name" defaultValue={p?.name} required autoFocus={!p} placeholder="např. Nový web s rezervacemi" />
          </Field>
          <Field label="Klient" htmlFor="clientId" required>
            <SelectInput id="clientId" name="clientId" defaultValue={p?.clientId ?? defaultClientId ?? clients[0].id} options={clients.map((c) => ({ value: c.id, label: c.name }))} />
          </Field>
          <Field label="Typ webu" htmlFor="type">
            <SelectInput id="type" name="type" defaultValue={p?.type ?? "presentation"} options={WEB_TYPE_ORDER.map((t) => ({ value: t, label: WEB_TYPE[t].label }))} />
          </Field>
          <Field label="Stav" htmlFor="status">
            <SelectInput
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              options={PROJECT_STATUS_ORDER.map((s) => ({ value: s, label: PROJECT_STATUS[s].label }))}
            />
          </Field>
          {status === "proposal" && (
            <Field label="Pravděpodobnost výhry (%)" htmlFor="probability">
              <TextInput id="probability" name="probability" inputMode="numeric" defaultValue={Math.round((p?.probability ?? 0.5) * 100)} />
            </Field>
          )}
          {(status === "in_progress" || status === "on_hold") && (
            <Field label="Postup (%)" htmlFor="progress">
              <TextInput id="progress" name="progress" inputMode="numeric" defaultValue={p?.progress ?? 0} />
            </Field>
          )}
          <Field label="Popis" htmlFor="description" className="sm:col-span-2">
            <TextArea id="description" name="description" defaultValue={p?.description} />
          </Field>
          <Field label="Technologie" htmlFor="stack" hint="Oddělte čárkou">
            <TextInput id="stack" name="stack" defaultValue={p?.stack.join(", ")} placeholder="Next.js, Webflow, Shopify…" />
          </Field>
          <Field label="URL živého webu" htmlFor="liveUrl">
            <TextInput id="liveUrl" name="liveUrl" defaultValue={p?.liveUrl} />
          </Field>
        </FormSection>

        <FormSection title="Peníze a čas" description="Z toho se počítá profitabilita, cashflow a plán vs. realita.">
          <Field label="Cena zakázky bez DPH (Kč)" htmlFor="price">
            <TextInput id="price" name="price" inputMode="numeric" defaultValue={p?.price ?? ""} />
          </Field>
          <Field label="Externí náklady (Kč)" htmlFor="externalCosts" hint="Licence, pluginy, fotky, freelanceři">
            <TextInput id="externalCosts" name="externalCosts" inputMode="numeric" defaultValue={p?.externalCosts ?? ""} />
          </Field>
          <Field label="Odhad hodin" htmlFor="estimatedHours">
            <TextInput id="estimatedHours" name="estimatedHours" inputMode="numeric" defaultValue={p?.estimatedHours ?? ""} />
          </Field>
          <Field label="Skutečně odpracováno (h)" htmlFor="actualHours">
            <TextInput id="actualHours" name="actualHours" inputMode="numeric" defaultValue={p?.actualHours ?? ""} />
          </Field>
          <Field label="Zahájení" htmlFor="startDate">
            <TextInput id="startDate" name="startDate" type="date" defaultValue={p?.startDate} />
          </Field>
          <Field label="Plánované dokončení" htmlFor="plannedEndDate">
            <TextInput id="plannedEndDate" name="plannedEndDate" type="date" defaultValue={p?.plannedEndDate} />
          </Field>
          {closed && (
            <Field label="Skutečné ukončení" htmlFor="actualEndDate">
              <TextInput id="actualEndDate" name="actualEndDate" type="date" defaultValue={p?.actualEndDate} />
            </Field>
          )}
        </FormSection>

        <FormSection title="Tým" description="Kolik hodin týdně na projektu kdo dělá – pro kapacitní plánovač.">
          <div className="space-y-2 sm:col-span-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar name={u.name} color={u.color} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{u.name}</span>
                <TextInput
                  aria-label={`Hodiny týdně – ${u.name}`}
                  inputMode="numeric"
                  value={team[u.id] || ""}
                  onChange={(e) => setTeam((t) => ({ ...t, [u.id]: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 }))}
                  placeholder="0"
                  className="w-20 text-right"
                />
                <span className="w-14 text-xs text-muted">h / týden</span>
              </div>
            ))}
          </div>
        </FormSection>

        {status === "on_hold" && (
          <FormSection title="Pozastavení">
            <Field label="Proč je projekt pozastaven" htmlFor="holdReason" className="sm:col-span-2">
              <TextArea id="holdReason" name="holdReason" defaultValue={p?.holdReason} />
            </Field>
          </FormSection>
        )}

        {closed && (
          <FormSection title="Výsledek" description="Pro případové studie a Win/Loss analýzu.">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-xs font-medium text-fg-2">{status === "completed" ? "Proč se to povedlo" : "Proč to nevyšlo"}</span>
              <div className="flex flex-wrap gap-1.5">
                {allReasons.map((r) => {
                  const on = reasons.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setReasons((cur) => (on ? cur.filter((x) => x !== r) : [...cur, r]))}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        on ? "border-accent/40 bg-accent-soft text-fg" : "border-line text-fg-2 hover:border-line-strong",
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <TextInput value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Vlastní důvod…" aria-label="Vlastní důvod" />
                <button
                  type="button"
                  onClick={() => {
                    const r = customReason.trim().replace(/,/g, "");
                    if (r && !reasons.includes(r)) setReasons((cur) => [...cur, r]);
                    setCustomReason("");
                  }}
                  className="h-9 shrink-0 rounded-lg border border-line px-3 text-xs font-medium text-fg hover:border-line-strong"
                >
                  Přidat
                </button>
              </div>
            </div>
            {status !== "lost" && (
              <Field label="Hodnocení klienta" htmlFor="rating-1">
                <div className="flex h-9 items-center gap-1" role="radiogroup" aria-label="Hodnocení 1 až 5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} id={`rating-${n}`} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(rating === n ? 0 : n)} aria-label={`${n} z 5`}>
                      <Star size={20} className={cn(n <= rating ? "fill-amber-400 text-amber-400" : "text-line-strong")} />
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <Field label="Zpětná vazba klienta" htmlFor="feedback" className="sm:col-span-2">
              <TextArea id="feedback" name="feedback" defaultValue={p?.feedback} />
            </Field>
          </FormSection>
        )}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
        <div className="mr-auto min-w-0">
          <FormMessage state={state} />
        </div>
        <Link href={p ? `/projects/${p.id}` : "/projects"} className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-fg-2 hover:bg-surface-2 hover:text-fg">
          Zrušit
        </Link>
        <SubmitButton>{p ? "Uložit změny" : "Vytvořit projekt"}</SubmitButton>
      </div>
    </form>
  );
}
