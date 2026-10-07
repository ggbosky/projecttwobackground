"use client";

import { LayoutGrid, Plus, Rows3, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClientStatusBadge, PriorityBadge, Tag } from "@/components/ui/Badge";
import { FilterChip, SearchInput, Segmented, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { formatCZK, formatCZKCompact, formatRelative } from "@/lib/format";
import { CLIENT_STATUS } from "@/lib/status";
import type { ClientStatus, Priority } from "@/lib/types";

export interface ClientRow {
  id: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  industry: string;
  city: string;
  status: ClientStatus;
  priority: Priority;
  tags: string[];
  projectCount: number;
  activeProjects: number;
  revenue: number;
  mrr: number;
  overdue: number;
  lastContact: string | null;
  score: number | null;
  scoreKind: "lead" | "health" | null;
  flags: number;
  openTasks: number;
  owner?: { id: string; name: string; color: string };
}

type SortKey = "revenue" | "company" | "lastContact" | "score" | "created";

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const STATUSES: ClientStatus[] = ["lead", "active", "former"];

function ScorePill({ score, kind }: { score: number | null; kind: "lead" | "health" | null }) {
  if (score === null || !kind) return <span className="text-xs text-muted">—</span>;
  const tone = score >= 75 ? "text-emerald-700 dark:text-emerald-400" : score >= 50 ? "text-blue-700 dark:text-blue-400" : score >= 30 ? "text-amber-700 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  const bar = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-blue-500" : score >= 30 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2" title={kind === "lead" ? "Lead score" : "Zdraví vztahu"}>
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-3">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("tabular text-xs font-semibold", tone)}>{score}</span>
      <span className="text-[10px] text-muted">{kind === "lead" ? "lead" : "zdraví"}</span>
    </div>
  );
}

export function ClientsExplorer({ rows, owners }: { rows: ClientRow[]; owners: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<ClientStatus[]>([]);
  const [owner, setOwner] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [sort, setSort] = useState<SortKey>("created");
  const [onlyFlags, setOnlyFlags] = useState(false);
  const [view, setView] = useState<"table" | "grid">("table");

  const industries = useMemo(() => [...new Set(rows.map((r) => r.industry).filter(Boolean))].sort((a, b) => a.localeCompare(b, "cs")), [rows]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const list = rows
      .filter((r) => (statuses.length ? statuses.includes(r.status) : true))
      .filter((r) => (industry === "all" ? true : r.industry === industry))
      .filter((r) => (owner === "all" ? true : r.owner?.id === owner))
      .filter((r) => (onlyFlags ? r.flags > 0 : true))
      .filter((r) =>
        q ? normalize(`${r.company} ${r.contactName} ${r.contactEmail} ${r.contactPhone} ${r.website} ${r.industry} ${r.city} ${r.tags.join(" ")}`).includes(q) : true,
      );
    if (sort === "created") return list;
    return [...list].sort((a, b) => {
      switch (sort) {
        case "company":
          return a.company.localeCompare(b.company, "cs");
        case "lastContact":
          return (b.lastContact ?? "").localeCompare(a.lastContact ?? "");
        case "score":
          return (b.score ?? -1) - (a.score ?? -1);
        default:
          return b.revenue - a.revenue;
      }
    });
  }, [rows, query, statuses, industry, owner, sort, onlyFlags]);

  const toggle = (s: ClientStatus) => setStatuses((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-surface">
        <EmptyState
          icon={Users}
          title="Zatím žádní klienti"
          description="Přidejte prvního klienta nebo lead. U každého můžete vést kontakty, kvalifikaci, komunikaci, úkoly, projekty a faktury – analýza se počítá automaticky."
          action={
            <Link href="/clients/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-card hover:brightness-110">
              <Plus size={15} /> Přidat prvního klienta
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_170px_170px_190px_auto]">
          <SearchInput value={query} onChange={setQuery} placeholder="Firma, kontakt, e-mail, telefon, štítek…" className="sm:col-span-2 lg:col-span-1" />
          <Select label="Odvětví" value={industry} onChange={setIndustry} options={[{ value: "all", label: "Všechna odvětví" }, ...industries.map((i) => ({ value: i, label: i }))]} />
          <Select label="Owner" value={owner} onChange={setOwner} options={[{ value: "all", label: "Všichni owneři" }, ...owners.map((o) => ({ value: o.id, label: o.name }))]} />
          <Select
            label="Řazení"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: "created", label: "Řadit: nejnovější" },
              { value: "score", label: "Řadit: skóre" },
              { value: "revenue", label: "Řadit: obrat (LTV)" },
              { value: "lastContact", label: "Řadit: poslední kontakt" },
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
          <FilterChip active={onlyFlags} onClick={() => setOnlyFlags((v) => !v)} count={rows.filter((r) => r.flags > 0).length}>
            <TriangleAlert size={12} /> Vyžaduje pozornost
          </FilterChip>
          <span className="ml-auto text-xs text-muted">{filtered.length} klientů</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState title="Žádný klient neodpovídá filtrům" description="Zkuste jiný výraz nebo zrušte filtry." />
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Klient</th>
                <th className="px-3 py-2.5 font-medium">Kontakt</th>
                <th className="px-3 py-2.5 font-medium">Stav</th>
                <th className="px-3 py-2.5 font-medium">Skóre</th>
                <th className="px-3 py-2.5 text-right font-medium">Projekty</th>
                <th className="px-3 py-2.5 text-right font-medium">Obrat (LTV)</th>
                <th className="px-5 py-2.5 font-medium">Poslední kontakt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => (
                <tr key={r.id} className="group transition-colors hover:bg-surface-2/60">
                  <td className="px-5 py-3">
                    <Link href={`/clients/${r.id}`} className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-xs font-semibold text-fg-2">
                        {r.company.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-fg group-hover:text-accent">{r.company}</span>
                          {r.flags > 0 && <TriangleAlert size={13} className="shrink-0 text-amber-500" aria-label={`${r.flags} upozornění`} />}
                        </span>
                        <span className="block truncate text-xs text-muted">{[r.industry, r.city].filter(Boolean).join(" · ") || "—"}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-fg-2">{r.contactName || "—"}</p>
                    <p className="text-xs text-muted">{r.contactEmail || r.contactPhone}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <ClientStatusBadge status={r.status} />
                      <span className="text-[10px] text-muted">Priorita {r.priority}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <ScorePill score={r.score} kind={r.scoreKind} />
                  </td>
                  <td className="tabular px-3 py-3 text-right text-fg-2">
                    {r.projectCount}
                    {r.activeProjects > 0 && <span className="ml-1 text-xs text-accent">({r.activeProjects} běží)</span>}
                  </td>
                  <td className="tabular px-3 py-3 text-right">
                    <span className="font-medium text-fg">{formatCZK(r.revenue)}</span>
                    {r.mrr > 0 && <span className="block text-[11px] text-muted">MRR {formatCZK(r.mrr)}</span>}
                    {r.overdue > 0 && <span className="block text-[11px] text-red-600 dark:text-red-400">po splatnosti {formatCZKCompact(r.overdue)}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {r.owner && <Avatar name={r.owner.name} color={r.owner.color} size="xs" title={`Owner: ${r.owner.name}`} />}
                      <span className="text-xs text-muted">{r.lastContact ? formatRelative(r.lastContact) : "nikdy"}</span>
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
                    <p className="truncate text-xs text-muted">{[r.industry, r.city].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                </div>
                <ClientStatusBadge status={r.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <ScorePill score={r.score} kind={r.scoreKind} />
                <PriorityBadge priority={r.priority} />
              </div>
              <div className="mt-3 text-xs text-fg-2">
                <p className="font-medium text-fg">{r.contactName || "Bez kontaktní osoby"}</p>
                <p className="truncate">{r.contactEmail}</p>
                <p>{r.contactPhone}</p>
              </div>
              {r.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              )}
              <div className="min-h-4 flex-1" />
              <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
                <div>
                  <p className="text-muted">Obrat</p>
                  <p className="tabular font-medium text-fg">{formatCZKCompact(r.revenue)}</p>
                </div>
                <div>
                  <p className="text-muted">Úkoly</p>
                  <p className="tabular font-medium text-fg">{r.openTasks}</p>
                </div>
                <div>
                  <p className="text-muted">Kontakt</p>
                  <p className="truncate font-medium text-fg">{r.lastContact ? formatRelative(r.lastContact) : "nikdy"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
