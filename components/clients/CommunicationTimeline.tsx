"use client";

import { Mail, Phone, Plus, StickyNote, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Select } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { REFERENCE_DATE, team } from "@/lib/data";
import { formatDate, formatRelative } from "@/lib/format";
import type { Communication, CommunicationType } from "@/lib/types";

const TYPE_META: Record<CommunicationType, { label: string; icon: typeof Mail; tone: string }> = {
  email: { label: "E-mail", icon: Mail, tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
  call: { label: "Telefonát", icon: Phone, tone: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10" },
  meeting: { label: "Schůzka", icon: Users, tone: "text-violet-700 dark:text-violet-300 bg-violet-500/10" },
  note: { label: "Poznámka", icon: StickyNote, tone: "text-amber-700 dark:text-amber-400 bg-amber-500/10" },
};

/**
 * Historie komunikace s klientem. Nové záznamy se v demu ukládají do
 * localStorage prohlížeče – v produkci je nahradí volání API.
 */
export function CommunicationTimeline({ clientId, entries }: { clientId: string; entries: Communication[] }) {
  const storageKey = `p2-comm-${clientId}`;
  const [local, setLocal] = useState<Communication[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CommunicationType>("note");
  const [author, setAuthor] = useState(team[0].id);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<CommunicationType | "all">("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLocal(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const persist = (list: Communication[]) => {
    setLocal(list);
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {}
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    persist([{ date: REFERENCE_DATE.toISOString(), type, author, summary: text.trim() }, ...local]);
    setText("");
    setOpen(false);
  };

  const all = [...local, ...entries]
    .filter((e) => filter === "all" || e.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {(["all", "email", "call", "meeting", "note"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium transition-colors",
              filter === t ? "bg-surface-3 text-fg" : "text-muted hover:text-fg",
            )}
          >
            {t === "all" ? "Vše" : TYPE_META[t].label}
          </button>
        ))}
        <Button variant="secondary" className="ml-auto h-8 text-xs" onClick={() => setOpen((o) => !o)}>
          <Plus size={14} /> Přidat záznam
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="animate-in mb-5 rounded-lg border border-line bg-surface-2/50 p-3">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Select
              label="Typ záznamu"
              value={type}
              onChange={(v) => setType(v as CommunicationType)}
              options={Object.entries(TYPE_META).map(([value, m]) => ({ value, label: m.label }))}
            />
            <Select label="Autor" value={author} onChange={setAuthor} options={team.map((m) => ({ value: m.id, label: m.name }))} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Shrnutí – co se řešilo, další kroky, nálada klienta…"
            className="w-full resize-none rounded-lg border border-line bg-surface p-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted">Demo: záznam se uloží jen v tomto prohlížeči.</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="h-8 text-xs" onClick={() => setOpen(false)}>
                Zrušit
              </Button>
              <Button type="submit" variant="primary" className="h-8 text-xs" disabled={!text.trim()}>
                Uložit
              </Button>
            </div>
          </div>
        </form>
      )}

      {all.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Žádné záznamy.</p>
      ) : (
        <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-line">
          {all.map((entry, i) => {
            const meta = TYPE_META[entry.type];
            const Icon = meta.icon;
            const member = team.find((m) => m.id === entry.author);
            const isLocal = local.includes(entry);
            return (
              <li key={`${entry.date}-${i}`} className="relative flex gap-3">
                <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface", meta.tone)}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span className="font-medium text-fg">{meta.label}</span>
                    <span className="text-muted" title={formatDate(entry.date.slice(0, 10))}>
                      {formatRelative(entry.date)}
                    </span>
                    {isLocal && <span className="rounded bg-accent-soft px-1 text-[10px] font-medium text-accent">nový</span>}
                    {member && (
                      <span className="ml-auto inline-flex items-center gap-1.5 text-muted">
                        <Avatar name={member.name} color={member.color} size="xs" />
                        {member.name.split(" ")[0]}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-fg-2">{entry.summary}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
