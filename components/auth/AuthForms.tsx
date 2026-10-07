"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { loginAction, setupAction } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  // Řízené pole – React by ho jinak po neúspěšném pokusu vymazal
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-xl">
      <div>
        <h1 className="text-base font-semibold text-fg">Přihlášení</h1>
        <p className="text-xs text-muted">Přístup jen pro tým Project Two.</p>
      </div>
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="E-mail" htmlFor="email">
        <TextInput id="email" name="email" type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Heslo" htmlFor="password">
        <TextInput id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Přihlašuji…">
        Přihlásit se
      </SubmitButton>
    </form>
  );
}

export function SetupForm() {
  const [state, action] = useActionState(setupAction, undefined);
  const [fields, setFields] = useState({ name: "", role: "", email: "" });
  const bind = (key: keyof typeof fields) => ({
    value: fields[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [key]: e.target.value })),
  });
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-xl">
      <div>
        <h1 className="text-base font-semibold text-fg">Vytvořte první účet</h1>
        <p className="text-xs text-muted">
          Aplikace zatím nemá žádného uživatele. Účty pro kolegy pak přidáte v sekci Tým.
        </p>
      </div>
      <Field label="Jméno a příjmení" htmlFor="name" required>
        <TextInput id="name" name="name" autoComplete="name" required autoFocus {...bind("name")} />
      </Field>
      <Field label="Role" htmlFor="role">
        <TextInput id="role" name="role" placeholder="např. Co-founder, Developer" {...bind("role")} />
      </Field>
      <Field label="E-mail" htmlFor="email" required>
        <TextInput id="email" name="email" type="email" autoComplete="username" required {...bind("email")} />
      </Field>
      <Field label="Heslo" htmlFor="password" hint="Alespoň 10 znaků." required>
        <TextInput id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Field label="Heslo znovu" htmlFor="password2" required>
        <TextInput id="password2" name="password2" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Vytvářím…">
        Vytvořit účet a pokračovat
      </SubmitButton>
    </form>
  );
}
