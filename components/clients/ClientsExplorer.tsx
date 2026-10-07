"use client";

import { LayoutGrid, Mail, Phone, Rows3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClientStatusBadge, Tag } from "@/components/ui/Badge";
import { FilterChip, SearchInput, Segmented, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCZK, formatCZKCompact, formatRelative } from "@/lib/format";
import { CLIENT_STATUS } from "@/lib/status";
import type { ClientStatus } from "@/lib/types";

export interface ClientRow {
  id: string;
  company: string;
  contactPerson: string;
  contactRole: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  city: string;
  status: ClientStatus;
  tags: string[];
  projectCount: number;
  activeProjects: number;
  revenue: number;
  mrr: number;
  lastContact?: string;
  owner?: { name: string; color: string };
}

type SortKey = "revenue" | "company" | "lastContact" | "projects";

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const STATUSES: ClientStatus[] = ["active", "lead", "former"];

export function ClientsExplorer({ rows }: { rows: ClientRow[] }) {
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<ClientStatus[]>([]);
  const [industry, setIndustry] = useState("all");
  const [sort, setSort] = useState<SortKey>("revenue");
  const [view, setView] = useState<"table" | "grid">("table");

  const industries = useMemo(() => [...new Set(rows.map((r) => r.industry))].sort((a, b) => a.localeCompare(b, "cs")), [rows]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const list = rows
      .filter((r) => (statuses.length ? statuses.includes(r.status) : true))
      .filter((r) => (industry === "all" ? true : r.industry === industry))
      .filter((r) =>
        q
          ? normalize(`${r.company} ${r.contactPerson} ${r.email} ${r.phone} ${r.website} ${r.industry} ${r.city} ${r.tags.join(" ")}`).includes(q)
          : true,
      );
    return list.sort((a, b) => {
      switch (sort) {
        case "company":
          return a.company.localeCompare(b.company, "cs");
        case "lastContact":
          return (b.lastContact ?? "").localeCompare(a.lastContact ?? "");
        case "projects":
          return b.projectCount - a.projectCount;
        default:
          return b.revenue - a.revenue;
      }
    });
  }, [rows, query, statuses, industry, sort]);

  const toggle = (s: ClientStatus) => setStatuses((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px_200px_auto]">
          <SearchInput value={query} onChange={setQuery} placeholder="Firma, kontakt, e-mail, telefon, štítek…" />
          <Select
            label="Odvětví"
            value={industry}
            onChange={setIndustry}
            options={[{ value: "all", label: "Všechna odvětví" }, ...industries.map((i) => ({ value: i, label: i }))]}
          />
          <Select
            label="Řazení"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: "revenue", label: "Řadit: obrat (LTV)" },
              { value: "lastContact", label: "Řadit: poslední kontakt" },
              { value: "projects", label: "Řadit: počet projektů" },
              { value: "company", label: "Řadit: název A–Z" },
            ]}
          />
          <Segmented
            label="Zobrazení"
            value={view}
            onChange={setView}
            options={[
              { value: "table", label: <Rows3 size={14} aria-label="Tabulka" /> },
              { value: "grid", label: <LayoutGrid size={14} aria-label="Karty" /> },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUSES.map((s) => (
            <FilterChip key={s} active={statuses.includes(s)} onClick={() => toggle(s)} count={rows.filter((r) => r.status === s).length}>
              {CLIENT_STATUS[s].label}
            </FilterChip>
          ))}
          {(statuses.length > 0 || industry !== "all" || query) && (
            <button
              onClick={() => {
                setStatuses([]);
                setIndustry("all");
                setQuery("");
              }}
              className="ml-1 text-xs text-muted hover:text-fg"
            >
              Zrušit filtry
            </button>
          )}
          <span className="ml-auto text-xs text-muted">{filtered.length} klientů</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState title="Žádný klient neodpovídá filtrům" description="Zkuste jiný výraz nebo zrušte filtry stavu a odvětví." />
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Firma</th>
                <th className="px-3 py-2.5 font-medium">Kontaktní osoba</th>
                <th className="px-3 py-2.5 font-medium">Odvětví</th>
                <th className="px-3 py-2.5 font-medium">Stav vztahu</th>
                <th className="px-3 py-2.5 text-right font-medium">Projekty</th>
                <th className="px-3 py-2.5 text-right font-medium">Obrat (LTV)</th>
                <th className="px-5 py-2.5 font-medium">Poslední kontakt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => (
                <tr key={r.id} className="group relative transition-colors hover:bg-surface-2/60">
                  <td className="px-5 py-3">
                    <Link href={`/clients/${r.id}`} className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-xs font-semibold text-fg-2">
                        {r.company.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-fg group-hover:text-accent">{r.company}</span>
                        <span className="block truncate text-xs text-muted">
                          {r.website} · {r.city}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-fg-2">{r.contactPerson}</p>
                    <div className="mt-0.5 flex items-center gap-2.5 text-xs text-muted">
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-accent" title={r.email}>
                        <Mail size={12} /> e-mail
                      </a>
                      <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 hover:text-accent" title={r.phone}>
                        <Phone size={12} /> {r.phone}
                      </a>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-fg-2">{r.industry}</td>
                  <td className="px-3 py-3">
                    <ClientStatusBadge status={r.status} />
                  </td>
                  <td className="tabular px-3 py-3 text-right text-fg-2">
                    {r.projectCount}
                    {r.activeProjects > 0 && <span className="ml-1 text-xs text-accent">({r.activeProjects} běží)</span>}
                  </td>
                  <td className="tabular px-3 py-3 text-right">
                    <span className="font-medium text-fg">{formatCZK(r.revenue)}</span>
                    {r.mrr > 0 && <span className="block text-[11px] text-muted">MRR {formatCZK(r.mrr)}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {r.owner && <Avatar name={r.owner.name} color={r.owner.color} size="xs" title={`Vlastník: ${r.owner.name}`} />}
                      <span className="text-xs text-muted">{r.lastContact ? formatRelative(r.lastContact) : "—"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/clients/${r.id}`}
              className="group flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-xs font-semibold text-fg-2">
                    {r.company.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg group-hover:text-accent">{r.company}</p>
                    <p className="truncate text-xs text-muted">{r.industry} · {r.city}</p>
                  </div>
                </div>
                <ClientStatusBadge status={r.status} />
              </div>
              <div className="mt-4 text-xs text-fg-2">
                <p className="font-medium text-fg">{r.contactPerson}</p>
                <p className="text-muted">{r.contactRole}</p>
                <p className="mt-1 truncate">{r.email}</p>
                <p>{r.phone}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <div className="min-h-4 flex-1" />
              <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
                <div>
                  <p className="text-muted">Obrat</p>
                  <p className="tabular font-medium text-fg">{formatCZKCompact(r.revenue)}</p>
                </div>
                <div>
                  <p className="text-muted">Projekty</p>
                  <p className="tabular font-medium text-fg">{r.projectCount}</p>
                </div>
                <div>
                  <p className="text-muted">Kontakt</p>
                  <p className="truncate font-medium text-fg">{r.lastContact ? formatRelative(r.lastContact) : "—"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
