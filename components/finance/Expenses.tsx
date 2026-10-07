"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteExpenseAction, saveExpenseAction } from "@/app/actions/finance";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";
import { formatCZK, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/status";
import type { Expense } from "@/lib/types";

export function Expenses({ expenses, today }: { expenses: Expense[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(saveExpenseAction, undefined);
  const [pending, start] = useTransition();
  const [month, setMonth] = useState("all");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const months = useMemo(() => [...new Set(expenses.map((e) => e.date.slice(0, 7)))].sort().reverse(), [expenses]);
  const list = expenses.filter((e) => month === "all" || e.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
  const byCategory = Object.entries(
    list.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const total = list.reduce((s, e) => s + e.amount, 0);

  return (
    <div className={pending ? "opacity-70" : undefined}>
      <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fg hover:border-line-strong"
        >
          <Plus size={14} /> Přidat náklad
        </button>
        {months.length > 0 && (
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Měsíc"
            className="h-8 rounded-lg border border-line bg-surface px-2 text-xs text-fg"
          >
            <option value="all">Všechny měsíce</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
        <span className="ml-auto text-xs text-muted">
          Celkem <span className="tabular font-medium text-fg">{formatCZK(total)}</span>
        </span>
      </div>

      {open && (
        <form ref={formRef} action={action} className="animate-in mx-5 mb-4 space-y-3 rounded-lg border border-line bg-surface-2/50 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Datum" htmlFor="exp-date">
              <TextInput id="exp-date" name="date" type="date" defaultValue={today} />
            </Field>
            <Field label="Kategorie" htmlFor="exp-cat">
              <TextInput id="exp-cat" name="category" list="exp-cats" defaultValue={EXPENSE_CATEGORIES[1]} />
              <datalist id="exp-cats">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Popis" htmlFor="exp-desc">
              <TextInput id="exp-desc" name="description" placeholder="např. Figma, hosting, coworking" />
            </Field>
            <Field label="Částka (Kč)" htmlFor="exp-amount">
              <TextInput id="exp-amount" name="amount" inputMode="decimal" required />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FormMessage state={state} />
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm text-fg-2 hover:bg-surface-2">
                Zavřít
              </button>
              <SubmitButton>Uložit náklad</SubmitButton>
            </div>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <EmptyState title="Zatím žádné náklady" description="Mzdy, nástroje, marketing… Náklady se odečítají od obratu v grafu zisku." />
      ) : (
        <div className="grid grid-cols-1 border-t border-line lg:grid-cols-3">
          <div className="overflow-x-auto lg:col-span-2 lg:border-r lg:border-line">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-muted">
                  <th className="px-5 py-2.5 font-medium">Datum</th>
                  <th className="px-3 py-2.5 font-medium">Kategorie</th>
                  <th className="px-3 py-2.5 font-medium">Popis</th>
                  <th className="px-3 py-2.5 text-right font-medium">Částka</th>
                  <th className="px-5 py-2.5">
                    <span className="sr-only">Akce</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.slice(0, 50).map((e) => (
                  <tr key={e.id} className="group hover:bg-surface-2/60">
                    <td className="tabular px-5 py-2.5 text-fg-2">{formatDate(e.date)}</td>
                    <td className="px-3 py-2.5 text-fg">{e.category}</td>
                    <td className="px-3 py-2.5 text-fg-2">{e.description || "—"}</td>
                    <td className="tabular px-3 py-2.5 text-right font-medium text-fg">{formatCZK(e.amount)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => start(() => deleteExpenseAction(e.id))}
                        className="rounded-md p-1.5 text-muted opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-600 focus:opacity-100"
                        aria-label="Smazat náklad"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2.5 p-5">
            <p className="text-xs font-medium text-muted">Podle kategorie</p>
            {byCategory.map(([cat, amount]) => (
              <div key={cat}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-fg-2">{cat}</span>
                  <span className="tabular text-fg">{formatCZK(amount)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-[var(--series-2)]" style={{ width: `${total ? (amount / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
