"use client";

import { CalendarClock, Check, Mail, Phone, Plus, StickyNote, Trash2, Users } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  addCommunicationAction,
  addTaskAction,
  deleteCommunicationAction,
  deleteTaskAction,
  toggleTaskAction,
} from "@/app/actions/clients";
import { Avatar } from "@/components/ui/Avatar";
import { Field, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { formatDate, formatRelative } from "@/lib/format";
import { COMM_TYPE } from "@/lib/status";
import type { ClientTask, Communication, CommunicationType, PublicUser } from "@/lib/types";

const TYPE_META: Record<CommunicationType, { icon: typeof Mail; tone: string }> = {
  email: { icon: Mail, tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
  call: { icon: Phone, tone: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" },
  meeting: { icon: Users, tone: "text-violet-700 dark:text-violet-300 bg-violet-500/10" },
  note: { icon: StickyNote, tone: "text-amber-700 dark:text-amber-400 bg-amber-500/10" },
};

/* ------------------------------------------------------------------ */
/* Komunikace                                                          */
/* ------------------------------------------------------------------ */

export function CommunicationLog({
  clientId,
  entries,
  users,
  meId,
  today,
}: {
  clientId: string;
  entries: Communication[];
  users: PublicUser[];
  meId: string;
  today: string;
}) {
  const [open, setOpen] = useState(entries.length === 0);
  const [filter, setFilter] = useState<CommunicationType | "all">("all");
  const [state, action] = useActionState(addCommunicationAction.bind(null, clientId), undefined);
  const [, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  const list = [...entries].filter((e) => filter === "all" || e.type === filter).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {(["all", "email", "call", "meeting", "note"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn("rounded-md px-2 py-1 text-xs font-medium transition-colors", filter === t ? "bg-surface-3 text-fg" : "text-muted hover:text-fg")}
          >
            {t === "all" ? `Vše (${entries.length})` : `${COMM_TYPE[t]} (${entries.filter((e) => e.type === t).length})`}
          </button>
        ))}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fg hover:border-line-strong"
        >
          <Plus size={14} /> Zaznamenat komunikaci
        </button>
      </div>

      {open && (
        <form ref={formRef} action={action} className="animate-in mb-5 space-y-3 rounded-lg border border-line bg-surface-2/50 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Typ" htmlFor="comm-type">
              <SelectInput id="comm-type" name="type" defaultValue="call" options={Object.entries(COMM_TYPE).map(([value, label]) => ({ value, label }))} />
            </Field>
            <Field label="Datum" htmlFor="comm-date">
              <TextInput id="comm-date" name="date" type="date" defaultValue={today} />
            </Field>
            <Field label="Kdo" htmlFor="comm-author">
              <SelectInput id="comm-author" name="authorId" defaultValue={meId} options={users.map((u) => ({ value: u.id, label: u.name }))} />
            </Field>
          </div>
          <Field label="Shrnutí" htmlFor="comm-summary">
            <TextArea id="comm-summary" name="summary" rows={3} required placeholder="Co se řešilo, na čem jste se dohodli, nálada klienta…" />
          </Field>
          <Field label="Další krok" htmlFor="comm-next">
            <TextInput id="comm-next" name="nextStep" placeholder="např. poslat nabídku do pátku" />
          </Field>
          <div className="flex items-center justify-between gap-2">
            <FormMessage state={state} />
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm text-fg-2 hover:bg-surface-2">
                Zrušit
              </button>
              <SubmitButton>Uložit záznam</SubmitButton>
            </div>
          </div>
        </form>
      )}

      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Zatím žádná komunikace. Zaznamenejte první hovor, e-mail nebo schůzku.</p>
      ) : (
        <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-line">
          {list.map((entry) => {
            const meta = TYPE_META[entry.type];
            const Icon = meta.icon;
            const member = users.find((m) => m.id === entry.authorId);
            return (
              <li key={entry.id} className="group relative flex gap-3">
                <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface", meta.tone)}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span className="font-medium text-fg">{COMM_TYPE[entry.type]}</span>
                    <span className="text-muted" title={formatDate(entry.date.slice(0, 10))}>
                      {formatDate(entry.date.slice(0, 10))} · {formatRelative(entry.date)}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-2">
                      {member && (
                        <span className="inline-flex items-center gap-1.5 text-muted">
                          <Avatar name={member.name} color={member.color} size="xs" />
                          {member.name.split(" ")[0]}
                        </span>
                      )}
                      <button
                        onClick={() => start(() => deleteCommunicationAction(clientId, entry.id))}
                        className="rounded p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 focus:opacity-100"
                        aria-label="Smazat záznam"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-fg-2">{entry.summary}</p>
                  {entry.nextStep && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-0.5 text-xs text-fg">
                      → {entry.nextStep}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Úkoly                                                               */
/* ------------------------------------------------------------------ */

export function TaskList({
  clientId,
  tasks,
  users,
  meId,
  today,
}: {
  clientId: string;
  tasks: ClientTask[];
  users: PublicUser[];
  meId: string;
  today: string;
}) {
  const [state, action] = useActionState(addTaskAction.bind(null, clientId), undefined);
  const [, start] = useTransition();
  const [showDone, setShowDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const open = tasks.filter((t) => !t.done).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));

  const row = (t: ClientTask) => {
    const assignee = users.find((u) => u.id === t.assigneeId);
    const overdue = !t.done && t.dueDate && t.dueDate < today;
    return (
      <li key={t.id} className="group flex items-start gap-3 py-2.5">
        <button
          onClick={() => start(() => toggleTaskAction(clientId, t.id))}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-line-strong hover:border-accent",
          )}
          aria-label={t.done ? "Označit jako nehotové" : "Označit jako hotové"}
        >
          {t.done && <Check size={13} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm", t.done ? "text-muted line-through" : "text-fg")}>{t.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            {t.dueDate && (
              <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-red-600 dark:text-red-400")}>
                <CalendarClock size={11} /> {formatDate(t.dueDate)}
                {overdue && " · po termínu"}
              </span>
            )}
            {assignee && (
              <span className="inline-flex items-center gap-1">
                <Avatar name={assignee.name} color={assignee.color} size="xs" /> {assignee.name.split(" ")[0]}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => start(() => deleteTaskAction(clientId, t.id))}
          className="rounded p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 focus:opacity-100"
          aria-label="Smazat úkol"
        >
          <Trash2 size={13} />
        </button>
      </li>
    );
  };

  return (
    <div>
      <form ref={formRef} action={action} className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_150px_auto]">
        <TextInput name="title" placeholder="Nový úkol – např. poslat nabídku" aria-label="Úkol" required />
        <TextInput name="dueDate" type="date" aria-label="Termín" />
        <SelectInput name="assigneeId" defaultValue={meId} aria-label="Řešitel" options={users.map((u) => ({ value: u.id, label: u.name }))} />
        <SubmitButton pendingLabel="…">
          <Plus size={15} /> Přidat
        </SubmitButton>
      </form>
      <FormMessage state={state?.error ? state : undefined} />
      {open.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">Žádné otevřené úkoly.</p>
      ) : (
        <ul className="divide-y divide-line">{open.map(row)}</ul>
      )}
      {done.length > 0 && (
        <div className="mt-2 border-t border-line pt-2">
          <button onClick={() => setShowDone((v) => !v)} className="text-xs text-muted hover:text-fg">
            {showDone ? "Skrýt" : "Zobrazit"} hotové ({done.length})
          </button>
          {showDone && <ul className="divide-y divide-line">{done.map(row)}</ul>}
        </div>
      )}
    </div>
  );
}
