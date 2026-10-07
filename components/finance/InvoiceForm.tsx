"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveInvoiceAction } from "@/app/actions/finance";
import { Checkbox, Field, FormMessage, SelectInput, SubmitButton, TextInput } from "@/components/ui/form";

export function InvoiceForm({
  clients,
  projects,
  fixedClientId,
  defaultProjectId = "",
  today,
  defaultOpen = false,
}: {
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string }[];
  fixedClientId?: string;
  defaultProjectId?: string;
  today: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [clientId, setClientId] = useState(fixedClientId ?? clients[0]?.id ?? "");
  const [paid, setPaid] = useState(false);
  const [state, action] = useActionState(saveInvoiceAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setPaid(false);
    }
  }, [state]);

  if (!clients.length) {
    return <p className="text-xs text-muted">Pro vystavení faktury nejdřív přidejte klienta.</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fg hover:border-line-strong"
      >
        <Plus size={14} /> Přidat fakturu
      </button>
    );
  }

  const clientProjects = projects.filter((p) => p.clientId === clientId);

  return (
    <form ref={formRef} action={action} className="animate-in space-y-3 rounded-lg border border-line bg-surface-2/50 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fixedClientId ? (
          <input type="hidden" name="clientId" value={fixedClientId} />
        ) : (
          <Field label="Klient" htmlFor="inv-client">
            <SelectInput
              id="inv-client"
              name="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
        )}
        <Field label="Projekt" htmlFor="inv-project">
          <SelectInput
            id="inv-project"
            name="projectId"
            defaultValue={defaultProjectId}
            options={[{ value: "", label: "— bez projektu —" }, ...clientProjects.map((p) => ({ value: p.id, label: p.name }))]}
          />
        </Field>
        <Field label="Typ" htmlFor="inv-kind">
          <SelectInput
            id="inv-kind"
            name="kind"
            defaultValue="project"
            options={[
              { value: "project", label: "Projekt" },
              { value: "retainer", label: "Retainer (měsíční)" },
              { value: "other", label: "Ostatní" },
            ]}
          />
        </Field>
        <Field label="Částka bez DPH (Kč)" htmlFor="inv-amount">
          <TextInput id="inv-amount" name="amount" inputMode="decimal" required />
        </Field>
        <Field label="Popis" htmlFor="inv-label" className="sm:col-span-2">
          <TextInput id="inv-label" name="label" placeholder="např. Záloha 40 % – nový web" />
        </Field>
        <Field label="Vystaveno" htmlFor="inv-issue">
          <TextInput id="inv-issue" name="issueDate" type="date" defaultValue={today} />
        </Field>
        <Field label="Splatnost" htmlFor="inv-due" hint="Prázdné = podle splatnosti klienta">
          <TextInput id="inv-due" name="dueDate" type="date" />
        </Field>
        <Field label="Číslo faktury" htmlFor="inv-number" hint="Prázdné = vygeneruje se">
          <TextInput id="inv-number" name="number" placeholder="FV-2026-0001" />
        </Field>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <Checkbox name="paid" label="Už uhrazeno" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
        </div>
        {paid && (
          <Field label="Datum úhrady" htmlFor="inv-paid">
            <TextInput id="inv-paid" name="paidDate" type="date" defaultValue={today} />
          </Field>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FormMessage state={state} />
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm text-fg-2 hover:bg-surface-2">
            Zavřít
          </button>
          <SubmitButton>Uložit fakturu</SubmitButton>
        </div>
      </div>
    </form>
  );
}
