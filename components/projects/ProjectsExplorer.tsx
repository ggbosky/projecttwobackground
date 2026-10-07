"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Rows3, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AvatarStack } from "@/components/ui/Avatar";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { DateInput, FilterChip, NumberInput, SearchInput, Segmented, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { clientName, clients, getMember, projects } from "@/lib/data";
import { formatCZK, formatCZKCompact, formatDate, formatDateShort } from "@/lib/format";
import { PROJECT_STATUS, PROJECT_STATUS_ORDER, WEB_TYPE, WEB_TYPE_ORDER } from "@/lib/status";
import type { Project, ProjectStatus, TeamMember } from "@/lib/types";

type SortKey = "startDate" | "plannedEndDate" | "price" | "progress" | "name";

interface Filters {
  q: string;
  status: ProjectStatus[];
  type: string;
  client: string;
  min: string;
  max: string;
  from: string;
  to: string;
  sort: SortKey;
  dir: "asc" | "desc";
  view: "table" | "board";
}

const DEFAULTS: Filters = {
  q: "",
  status: [],
  type: "all",
  client: "all",
  min: "",
  max: "",
  from: "",
  to: "",
  sort: "startDate",
  dir: "desc",
  view: "table",
};

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function readFilters(sp: URLSearchParams): Filters {
  const status = (sp.get("status") ?? "")
    .split(",")
    .filter((s): s is ProjectStatus => s in PROJECT_STATUS);
  return {
    q: sp.get("q") ?? "",
    status,
    type: sp.get("type") ?? "all",
    client: sp.get("client") ?? "all",
    min: sp.get("min") ?? "",
    max: sp.get("max") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    sort: (sp.get("sort") as SortKey) ?? DEFAULTS.sort,
    dir: sp.get("dir") === "asc" ? "asc" : "desc",
    view: sp.get("view") === "board" ? "board" : "table",
  };
}

function toQuery(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.status.length) sp.set("status", f.status.join(","));
  if (f.type !== "all") sp.set("type", f.type);
  if (f.client !== "all") sp.set("client", f.client);
  if (f.min) sp.set("min", f.min);
  if (f.max) sp.set("max", f.max);
  if (f.from) sp.set("from", f.from);
  if (f.to) sp.set("to", f.to);
  if (f.sort !== DEFAULTS.sort) sp.set("sort", f.sort);
  if (f.dir !== DEFAULTS.dir) sp.set("dir", f.dir);
  if (f.view !== DEFAULTS.view) sp.set("view", f.view);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function applyFilters(list: Project[], f: Filters): Project[] {
  const q = normalize(f.q.trim());
  const min = f.min ? Number(f.min) : undefined;
  const max = f.max ? Number(f.max) : undefined;
  const filtered = list.filter((p) => {
    if (f.status.length && !f.status.includes(p.status)) return false;
    if (f.type !== "all" && p.type !== f.type) return false;
    if (f.client !== "all" && p.clientId !== f.client) return false;
    if (min !== undefined && p.price < min) return false;
    if (max !== undefined && p.price > max) return false;
    // Datum: projekt zasahuje do zvoleného intervalu
    if (f.from && (p.actualEndDate ?? p.plannedEndDate) < f.from) return false;
    if (f.to && p.startDate > f.to) return false;
    if (q && !normalize(`${p.name} ${clientName(p.clientId)} ${p.stack.join(" ")} ${p.description} ${p.repo ?? ""}`).includes(q))
      return false;
    return true;
  });
  const dir = f.dir === "asc" ? 1 : -1;
  return filtered.sort((a, b) => {
    switch (f.sort) {
      case "price":
        return (a.price - b.price) * dir;
      case "progress":
        return (a.progress - b.progress) * dir;
      case "name":
        return a.name.localeCompare(b.name, "cs") * dir;
      case "plannedEndDate":
        return a.plannedEndDate.localeCompare(b.plannedEndDate) * dir;
      default:
        return a.startDate.localeCompare(b.startDate) * dir;
    }
  });
}

export function ProjectsExplorer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState<Filters>(() => readFilters(new URLSearchParams(searchParams.toString())));
  const [showAdvanced, setShowAdvanced] = useState(() => Boolean(f.min || f.max || f.from || f.to || f.client !== "all"));

  // Synchronizace filtrů do URL – odkaz lze sdílet s kolegy
  useEffect(() => {
    const next = toQuery(f);
    if (next !== (searchParams.toString() ? `?${searchParams.toString()}` : "")) {
      router.replace(`${pathname}${next}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setF((cur) => ({ ...cur, [key]: value }));
  const filtered = useMemo(() => applyFilters(projects, f), [f]);
  const total = filtered.reduce((s, p) => s + p.price, 0);
  const boardColumns = f.status.length ? PROJECT_STATUS_ORDER.filter((s) => f.status.includes(s)) : PROJECT_STATUS_ORDER;
  const activeFilterCount =
    (f.q ? 1 : 0) + (f.status.length ? 1 : 0) + (f.type !== "all" ? 1 : 0) + (f.client !== "all" ? 1 : 0) + (f.min || f.max ? 1 : 0) + (f.from || f.to ? 1 : 0);

  const toggleStatus = (s: ProjectStatus) =>
    set("status", f.status.includes(s) ? f.status.filter((x) => x !== s) : [...f.status, s]);

  const sortBy = (key: SortKey) =>
    setF((cur) => ({ ...cur, sort: key, dir: cur.sort === key ? (cur.dir === "asc" ? "desc" : "asc") : "desc" }));

  const SortTh = ({ k, children, className }: { k: SortKey; children: ReactNode; className?: string }) => (
    <th className={cn("px-3 py-2.5 font-medium", className)}>
      <button onClick={() => sortBy(k)} className="inline-flex items-center gap-1 hover:text-fg">
        {children}
        {f.sort === k ? f.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}
      </button>
    </th>
  );

  return (
    <div>
      {/* Filtry */}
      <div className="mb-4 rounded-xl border border-line bg-surface p-3 shadow-card">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px_auto_auto]">
          <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Hledat projekt, klienta, technologii…" />
          <Select
            label="Typ webu"
            value={f.type}
            onChange={(v) => set("type", v)}
            options={[{ value: "all", label: "Všechny typy" }, ...WEB_TYPE_ORDER.map((t) => ({ value: t, label: WEB_TYPE[t].label }))]}
          />
          <button
            onClick={() => setShowAdvanced((s) => !s)}
            aria-expanded={showAdvanced}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
              showAdvanced ? "border-accent/40 bg-accent-soft text-fg" : "border-line text-fg-2 hover:border-line-strong hover:text-fg",
            )}
          >
            <SlidersHorizontal size={14} /> Další filtry
          </button>
          <Segmented
            label="Zobrazení"
            value={f.view}
            onChange={(v) => set("view", v)}
            options={[
              { value: "table", label: <span className="inline-flex items-center gap-1.5"><Rows3 size={14} />Tabulka</span> },
              { value: "board", label: <span className="inline-flex items-center gap-1.5"><Columns3 size={14} />Board</span> },
            ]}
          />
        </div>

        {showAdvanced && (
          <div className="animate-in mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3 lg:grid-cols-5">
            <Select
              className="col-span-2 lg:col-span-1"
              label="Klient"
              value={f.client}
              onChange={(v) => set("client", v)}
              options={[
                { value: "all", label: "Všichni klienti" },
                ...[...clients].sort((a, b) => a.company.localeCompare(b.company, "cs")).map((c) => ({ value: c.id, label: c.company })),
              ]}
            />
            <NumberInput label="Cena od" value={f.min} onChange={(v) => set("min", v)} placeholder="Cena od" />
            <NumberInput label="Cena do" value={f.max} onChange={(v) => set("max", v)} placeholder="Cena do" />
            <DateInput label="Období od" value={f.from} onChange={(v) => set("from", v)} />
            <DateInput label="Období do" value={f.to} onChange={(v) => set("to", v)} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {PROJECT_STATUS_ORDER.map((s) => (
            <FilterChip key={s} active={f.status.includes(s)} onClick={() => toggleStatus(s)} count={projects.filter((p) => p.status === s).length}>
              {PROJECT_STATUS[s].label}
            </FilterChip>
          ))}
          {activeFilterCount > 0 && (
            <button onClick={() => setF({ ...DEFAULTS, view: f.view })} className="ml-1 text-xs text-muted hover:text-fg">
              Zrušit filtry ({activeFilterCount})
            </button>
          )}
          <span className="ml-auto text-xs text-muted">
            {filtered.length} projektů · <span className="tabular font-medium text-fg">{formatCZKCompact(total)}</span>
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState
            title="Žádný projekt neodpovídá filtrům"
            description="Upravte rozsah ceny, data nebo stav."
            action={
              <button onClick={() => setF({ ...DEFAULTS, view: f.view })} className="mt-2 text-xs font-medium text-accent hover:underline">
                Zrušit všechny filtry
              </button>
            }
          />
        </div>
      ) : f.view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-muted">
                <SortTh k="name" className="pl-5">Projekt</SortTh>
                <th className="px-3 py-2.5 font-medium">Typ</th>
                <th className="px-3 py-2.5 font-medium">Stav</th>
                <SortTh k="price" className="text-right">Cena</SortTh>
                <SortTh k="progress">Postup</SortTh>
                <SortTh k="startDate">Zahájení</SortTh>
                <SortTh k="plannedEndDate">Termín</SortTh>
                <th className="px-3 py-2.5 pr-5 font-medium">Tým</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => {
                const members = p.team.map((a) => getMember(a.memberId)).filter(Boolean) as TeamMember[];
                const late = p.actualEndDate && p.status === "completed" && p.actualEndDate > p.plannedEndDate;
                return (
                  <tr key={p.id} className="group transition-colors hover:bg-surface-2/60">
                    <td className="py-3 pr-3 pl-5">
                      <Link href={`/projects/${p.id}`} className="block">
                        <span className="block font-medium text-fg group-hover:text-accent">{p.name}</span>
                        <span className="block text-xs text-muted">{clientName(p.clientId)}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-fg-2">
                        <span className="size-2 rounded-[3px]" style={{ background: WEB_TYPE[p.type].color }} />
                        {WEB_TYPE[p.type].label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <ProjectStatusBadge status={p.status} />
                    </td>
                    <td className="tabular px-3 py-3 text-right font-medium text-fg">
                      {formatCZK(p.price)}
                      {p.status === "proposal" && p.probability !== undefined && (
                        <span className="block text-[11px] font-normal text-muted">šance {Math.round(p.probability * 100)} %</span>
                      )}
                    </td>
                    <td className="w-40 px-3 py-3">
                      {p.status === "completed" ? (
                        <Stars value={p.rating} size={12} />
                      ) : ["in_progress", "on_hold"].includes(p.status) ? (
                        <div className="flex items-center gap-2">
                          <Progress value={p.progress} max={100} tone={p.status === "on_hold" ? "warn" : "accent"} />
                          <span className="tabular w-8 text-xs text-muted">{p.progress} %</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="tabular px-3 py-3 text-xs text-fg-2">{formatDate(p.startDate)}</td>
                    <td className="tabular px-3 py-3 text-xs">
                      <span className="text-fg-2">{formatDate(p.actualEndDate ?? p.plannedEndDate)}</span>
                      {late && <span className="block text-[11px] text-amber-700 dark:text-amber-400">po termínu</span>}
                    </td>
                    <td className="px-3 py-3 pr-5">{members.length ? <AvatarStack members={members} max={3} size="xs" /> : <span className="text-xs text-muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${boardColumns.length}, minmax(220px, 1fr))`,
              minWidth: boardColumns.length * 230,
            }}
          >
            {boardColumns.map((status) => {
              const column = filtered.filter((p) => p.status === status);
              return (
                <div key={status} className="rounded-xl border border-line bg-surface-2/40 p-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1 px-1.5 pt-1">
                    <ProjectStatusBadge status={status} />
                    <span className="tabular text-[11px] text-muted">
                      {column.length} · {formatCZKCompact(column.reduce((s, p) => s + p.price, 0))}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {column.map((p) => {
                      const members = p.team.map((a) => getMember(a.memberId)).filter(Boolean) as TeamMember[];
                      return (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          className="block rounded-lg border border-line bg-surface p-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong"
                        >
                          <p className="text-xs font-medium text-fg">{p.name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted">{clientName(p.clientId)}</p>
                          {["in_progress", "on_hold"].includes(p.status) && (
                            <Progress className="mt-2" value={p.progress} max={100} tone={p.status === "on_hold" ? "warn" : "accent"} />
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="tabular text-[11px] font-medium text-fg-2">{formatCZKCompact(p.price)}</span>
                            <span className="text-[11px] text-muted">{formatDateShort(p.actualEndDate ?? p.plannedEndDate)}</span>
                          </div>
                          {members.length > 0 && (
                            <div className="mt-2">
                              <AvatarStack members={members} max={4} size="xs" />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                    {column.length === 0 && <p className="px-2 py-4 text-center text-[11px] text-muted">Prázdné</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
