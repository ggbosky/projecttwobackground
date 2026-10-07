"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InvoiceStatusBadge } from "@/components/ui/Badge";
import { DateInput, FilterChip, SearchInput, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { clientName } from "@/lib/data";
import { formatCZK, formatDate } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/status";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const STATUSES: InvoiceStatus[] = ["overdue", "pending", "paid"];

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<InvoiceStatus[]>([]);
  const [kind, setKind] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(15);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return invoices
      .filter((i) => (statuses.length ? statuses.includes(i.status) : true))
      .filter((i) => (kind === "all" ? true : i.kind === kind))
      .filter((i) => (from ? i.issueDate >= from : true))
      .filter((i) => (to ? i.issueDate <= to : true))
      .filter((i) => (q ? normalize(`${i.number} ${i.label} ${clientName(i.clientId)}`).includes(q) : true))
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));
  }, [invoices, query, statuses, kind, from, to]);

  const sum = filtered.reduce((s, i) => s + i.amount, 0);
  const toggle = (s: InvoiceStatus) => setStatuses((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <div>
      <div className="flex flex-col gap-3 px-5 pb-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_160px_150px_150px]">
          <SearchInput value={query} onChange={setQuery} placeholder="Číslo faktury, klient, popis…" />
          <Select
            label="Typ"
            value={kind}
            onChange={setKind}
            options={[
              { value: "all", label: "Všechny typy" },
              { value: "project", label: "Projektové" },
              { value: "retainer", label: "Retainery" },
            ]}
          />
          <DateInput label="Vystaveno od" value={from} onChange={setFrom} />
          <DateInput label="Vystaveno do" value={to} onChange={setTo} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUSES.map((s) => (
            <FilterChip key={s} active={statuses.includes(s)} onClick={() => toggle(s)} count={invoices.filter((i) => i.status === s).length}>
              {INVOICE_STATUS[s].label}
            </FilterChip>
          ))}
          <span className="ml-auto text-xs text-muted">
            {filtered.length} faktur · <span className="tabular font-medium text-fg">{formatCZK(sum)}</span>
          </span>
        </div>
      </div>
      <div className="overflow-x-auto border-t border-line">
        {filtered.length === 0 ? (
          <EmptyState title="Žádné faktury" description="Zkuste upravit filtry nebo hledaný výraz." />
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Faktura</th>
                <th className="px-3 py-2.5 font-medium">Klient</th>
                <th className="px-3 py-2.5 font-medium">Vystaveno</th>
                <th className="px-3 py-2.5 font-medium">Splatnost</th>
                <th className="px-3 py-2.5 font-medium">Stav</th>
                <th className="px-5 py-2.5 text-right font-medium">Částka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.slice(0, limit).map((i) => (
                <tr key={i.id} className="transition-colors hover:bg-surface-2/60">
                  <td className="px-5 py-2.5">
                    <p className="font-mono text-xs text-fg">{i.number}</p>
                    <p className="max-w-[280px] truncate text-xs text-muted">
                      {i.projectId ? (
                        <Link href={`/projects/${i.projectId}`} className="hover:text-accent">
                          {i.label}
                        </Link>
                      ) : (
                        i.label
                      )}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/clients/${i.clientId}`} className="text-fg-2 hover:text-accent">
                      {clientName(i.clientId)}
                    </Link>
                  </td>
                  <td className="tabular px-3 py-2.5 text-fg-2">{formatDate(i.issueDate)}</td>
                  <td className="tabular px-3 py-2.5 text-fg-2">{formatDate(i.dueDate)}</td>
                  <td className="px-3 py-2.5">
                    <InvoiceStatusBadge status={i.status} />
                  </td>
                  <td className="tabular px-5 py-2.5 text-right font-medium text-fg">{formatCZK(i.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {filtered.length > limit && (
        <div className="border-t border-line px-5 py-3 text-center">
          <button onClick={() => setLimit((l) => l + 20)} className="text-xs font-medium text-accent hover:underline">
            Načíst další ({filtered.length - limit})
          </button>
        </div>
      )}
    </div>
  );
}
