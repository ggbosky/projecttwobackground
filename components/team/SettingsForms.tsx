"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveSettingsAction } from "@/app/actions/finance";
import { changePasswordAction, updateProfileAction } from "@/app/actions/team";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { MEMBER_COLORS } from "@/lib/status";
import type { PublicUser, Settings } from "@/lib/types";

export function ProfileForm({ me }: { me: PublicUser }) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  const [color, setColor] = useState(me.color);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="color" value={color} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Jméno" htmlFor="p-name" required>
          <TextInput id="p-name" name="name" defaultValue={me.name} required />
        </Field>
        <Field label="E-mail (přihlašovací)" htmlFor="p-email" required>
          <TextInput id="p-email" name="email" type="email" defaultValue={me.email} required />
        </Field>
        <Field label="Role" htmlFor="p-role">
          <TextInput id="p-role" name="role" defaultValue={me.role} />
        </Field>
        <Field label="Kapacita (h / týden)" htmlFor="p-hours" hint="Kolik hodin týdně můžeš dát projektům">
          <TextInput id="p-hours" name="hoursPerWeek" inputMode="numeric" defaultValue={me.hoursPerWeek} />
        </Field>
        <Field label="Nákladová sazba (Kč / h)" htmlFor="p-cost" hint="Mzda + režie – pro výpočet ziskovosti projektů">
          <TextInput id="p-cost" name="hourlyCost" inputMode="numeric" defaultValue={me.hourlyCost || ""} />
        </Field>
        <Field label="Barva avataru" htmlFor="color-0">
          <div className="flex h-9 items-center gap-2">
            {MEMBER_COLORS.map((c, i) => (
              <button
                key={c}
                id={`color-${i}`}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Barva ${c}`}
                aria-pressed={color === c}
                className={cn("size-6 rounded-full ring-offset-2 ring-offset-surface transition-all", color === c && "ring-2 ring-fg")}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FormMessage state={state} />
        <SubmitButton className="ml-auto">Uložit profil</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Současné heslo" htmlFor="pw-current">
          <TextInput id="pw-current" name="current" type="password" autoComplete="current-password" required />
        </Field>
        <Field label="Nové heslo" htmlFor="pw-new" hint="Alespoň 10 znaků">
          <TextInput id="pw-new" name="password" type="password" autoComplete="new-password" minLength={10} required />
        </Field>
        <Field label="Nové heslo znovu" htmlFor="pw-new2">
          <TextInput id="pw-new2" name="password2" type="password" autoComplete="new-password" minLength={10} required />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FormMessage state={state} />
        <SubmitButton className="ml-auto">Změnit heslo</SubmitButton>
      </div>
    </form>
  );
}

export function AgencySettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(saveSettingsAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Měsíční cíl obratu (Kč)" htmlFor="s-target">
          <TextInput id="s-target" name="targetMonthlyRevenue" inputMode="numeric" defaultValue={settings.targetMonthlyRevenue || ""} />
        </Field>
        <Field label="Cílová marže (%)" htmlFor="s-margin">
          <TextInput id="s-margin" name="targetMargin" inputMode="numeric" defaultValue={Math.round(settings.targetMargin * 100)} />
        </Field>
        <Field label="Rezerva kapacity (%)" htmlFor="s-buffer" hint="Čas na podporu, obchod a nečekané úkoly">
          <TextInput id="s-buffer" name="capacityBuffer" inputMode="numeric" defaultValue={Math.round(settings.capacityBuffer * 100)} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FormMessage state={state} />
        <SubmitButton className="ml-auto">Uložit nastavení</SubmitButton>
      </div>
    </form>
  );
}
