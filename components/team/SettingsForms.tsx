"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/app/actions/finance";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";
import type { Settings } from "@/lib/types";

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
