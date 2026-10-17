"use client";

import { Pencil, UserPlus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { addMemberAction, updateMemberAction } from "@/app/actions/team";
import { Checkbox, Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { MEMBER_COLORS } from "@/lib/status";
import type { PublicUser } from "@/lib/types";

export function AddMemberForm({ firstMember = false }: { firstMember?: boolean }) {
  const [open, setOpen] = useState(firstMember);
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
      <p className="text-sm font-semibold text-fg">{firstMember ? "Kdo jste? Přidejte sebe a kolegy" : "Nový člen týmu"}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Jméno a příjmení" htmlFor="m-name" required>
          <TextInput id="m-name" name="name" required autoFocus={firstMember} />
        </Field>
        <Field label="Role" htmlFor="m-role">
          <TextInput id="m-role" name="role" placeholder="např. Design, Vývoj" />
        </Field>
        <Field label="E-mail" htmlFor="m-email">
          <TextInput id="m-email" name="email" type="email" />
        </Field>
        <Field label="Kapacita (h / týden)" htmlFor="m-hours">
          <TextInput id="m-hours" name="hoursPerWeek" inputMode="numeric" defaultValue={40} />
        </Field>
        <Field label="Nákladová sazba (Kč / h)" htmlFor="m-cost" hint="Pro výpočet ziskovosti">
          <TextInput id="m-cost" name="hourlyCost" inputMode="numeric" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Checkbox name="makeMe" label="To jsem já (pracuji jako tento člen)" defaultChecked={firstMember} />
        <FormMessage state={state} />
        <div className="ml-auto flex gap-2">
          {!firstMember && (
            <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm text-fg-2 hover:bg-surface-2">
              Zavřít
            </button>
          )}
          <SubmitButton>Přidat</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export function EditMember({ member }: { member: PublicUser }) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(member.color);
  const [state, action] = useActionState(updateMemberAction.bind(null, member.id), undefined);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg">
        <Pencil size={13} /> Upravit
      </button>
    );
  }

  return (
    <form action={action} className="animate-in mt-3 w-full space-y-3 rounded-lg border border-line bg-surface-2/50 p-3">
      <input type="hidden" name="color" value={color} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Jméno" htmlFor={`e-name-${member.id}`}>
          <TextInput id={`e-name-${member.id}`} name="name" defaultValue={member.name} required />
        </Field>
        <Field label="Role" htmlFor={`e-role-${member.id}`}>
          <TextInput id={`e-role-${member.id}`} name="role" defaultValue={member.role} />
        </Field>
        <Field label="E-mail" htmlFor={`e-email-${member.id}`}>
          <TextInput id={`e-email-${member.id}`} name="email" type="email" defaultValue={member.email} />
        </Field>
        <Field label="Kapacita (h / týden)" htmlFor={`e-hours-${member.id}`}>
          <TextInput id={`e-hours-${member.id}`} name="hoursPerWeek" inputMode="numeric" defaultValue={member.hoursPerWeek} />
        </Field>
        <Field label="Nákladová sazba (Kč / h)" htmlFor={`e-cost-${member.id}`}>
          <TextInput id={`e-cost-${member.id}`} name="hourlyCost" inputMode="numeric" defaultValue={member.hourlyCost || ""} />
        </Field>
        <Field label="Barva" htmlFor={`e-color-${member.id}-0`}>
          <div className="flex h-9 items-center gap-2">
            {MEMBER_COLORS.map((c, i) => (
              <button
                key={c}
                id={`e-color-${member.id}-${i}`}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Barva ${c}`}
                aria-pressed={color === c}
                className={cn("size-6 rounded-full ring-offset-2 ring-offset-surface", color === c && "ring-2 ring-fg")}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
      </div>
      <div className="flex items-center gap-2">
        <FormMessage state={state} />
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm text-fg-2 hover:bg-surface-2">
            Zrušit
          </button>
          <SubmitButton>Uložit</SubmitButton>
        </div>
      </div>
    </form>
  );
}
