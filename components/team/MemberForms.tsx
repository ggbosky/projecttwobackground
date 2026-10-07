"use client";

import { UserPlus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { addMemberAction } from "@/app/actions/team";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";

export function AddMemberForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(addMemberAction, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110"
      >
        <UserPlus size={15} /> Přidat člena týmu
      </button>
    );
  }

  return (
    <form ref={ref} action={action} className="animate-in w-full space-y-3 rounded-xl border border-line bg-surface p-4 shadow-card">
      <p className="text-sm font-semibold text-fg">Nový účet pro kolegu</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Jméno a příjmení" htmlFor="m-name" required>
          <TextInput id="m-name" name="name" required />
        </Field>
        <Field label="E-mail (přihlašovací)" htmlFor="m-email" required>
          <TextInput id="m-email" name="email" type="email" required autoComplete="off" />
        </Field>
        <Field label="Role" htmlFor="m-role">
          <TextInput id="m-role" name="role" placeholder="např. Developer, Designer" />
        </Field>
        <Field label="Dočasné heslo" htmlFor="m-pass" hint="Alespoň 10 znaků – kolega si ho změní v Nastavení." required>
          <TextInput id="m-pass" name="password" type="text" minLength={10} required autoComplete="new-password" />
        </Field>
        <Field label="Kapacita (h / týden)" htmlFor="m-hours">
          <TextInput id="m-hours" name="hoursPerWeek" inputMode="numeric" defaultValue={40} />
        </Field>
        <Field label="Nákladová sazba (Kč / h)" htmlFor="m-cost" hint="Mzda + režie, pro výpočet ziskovosti">
          <TextInput id="m-cost" name="hourlyCost" inputMode="numeric" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FormMessage state={state} />
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm text-fg-2 hover:bg-surface-2">
            Zavřít
          </button>
          <SubmitButton>Vytvořit účet</SubmitButton>
        </div>
      </div>
    </form>
  );
}
