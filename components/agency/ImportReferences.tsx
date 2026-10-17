"use client";

import { Check, Download } from "lucide-react";
import { useState, useTransition } from "react";
import { importReferencesAction } from "@/app/actions/clients";
import { REFERENCES } from "@/lib/agency";
import { cn } from "@/lib/cn";

export function ImportReferences({ existing }: { existing: string[] }) {
  const available = REFERENCES.filter((r) => !existing.includes(r.website));
  const [selected, setSelected] = useState<string[]>(available.map((r) => r.key));
  const [pending, start] = useTransition();
  const [done, setDone] = useState<number | null>(null);

  if (!available.length) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
        <Check size={14} /> {done ? `Přidáno ${done} klientů. ` : ""}Všechny reference z webu už máte v CRM.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {available.map((r) => {
          const on = selected.includes(r.key);
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={on}
              onClick={() => setSelected((cur) => (on ? cur.filter((k) => k !== r.key) : [...cur, r.key]))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                on ? "border-accent/40 bg-accent-soft text-fg" : "border-line text-fg-2 hover:border-line-strong",
              )}
            >
              {on && <Check size={12} />} {r.company}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!selected.length || pending}
          onClick={() =>
            start(async () => {
              const res = await importReferencesAction(selected);
              setDone(res.added);
            })
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110 disabled:opacity-50"
        >
          <Download size={15} /> {pending ? "Přidávám…" : `Přidat do CRM (${selected.length})`}
        </button>
        {done !== null && <span className="text-xs text-emerald-700 dark:text-emerald-400">Přidáno {done} klientů.</span>}
      </div>
    </div>
  );
}
