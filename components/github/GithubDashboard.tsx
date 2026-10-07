"use client";

import {
  ChevronDown,
  CircleDot,
  GitPullRequest,
  KeyRound,
  Plug,
  RefreshCw,
  Rocket,
  ServerCrash,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, FilterChip, SearchInput } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/EmptyState";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { cn } from "@/lib/cn";
import { clientName, getProject } from "@/lib/data";
import { formatRelative } from "@/lib/format";
import { DEPLOY_STATE } from "@/lib/status";
import type { DeployState, Repo } from "@/lib/types";
import { RepoActivity, RepoHeader, nowFor, useGithub } from "./RepoDetails";

const DEPLOY_FILTERS: DeployState[] = ["ready", "building", "error", "none"];

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function GithubDashboard() {
  const { data, loading, error, refresh } = useGithub();
  const [query, setQuery] = useState("");
  const [states, setStates] = useState<DeployState[]>([]);
  const [onlyPrs, setOnlyPrs] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const now = nowFor(data);

  const repos = useMemo(() => data?.repos ?? [], [data]);
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return repos
      .filter((r) => (states.length ? states.includes(r.deployment.state) : true))
      .filter((r) => (onlyPrs ? r.pullRequests.length > 0 : true))
      .filter((r) => {
        if (!q) return true;
        const p = getProject(r.projectId);
        return normalize(`${r.fullName} ${r.description} ${p?.name ?? ""} ${p ? clientName(p.clientId) : ""}`).includes(q);
      })
      .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
  }, [repos, query, states, onlyPrs]);

  const stats = {
    repos: repos.length,
    prs: repos.reduce((s, r) => s + r.pullRequests.length, 0),
    issues: repos.reduce((s, r) => s + r.issues.length, 0),
    failing: repos.filter((r) => r.deployment.state === "error").length,
    building: repos.filter((r) => r.deployment.state === "building").length,
  };

  const feed = repos
    .flatMap((r) => [
      ...r.commits.map((c) => ({ kind: "commit" as const, date: c.date, title: c.message, who: c.author, repo: r })),
      ...r.pullRequests.map((p) => ({ kind: "pr" as const, date: p.createdAt, title: p.title, who: p.author, repo: r })),
    ])
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);

  const toggleState = (s: DeployState) => setStates((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <div className="space-y-4">
      {/* Připojení */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <span className="relative flex size-12 items-center justify-center rounded-xl bg-fg text-bg">
              <GithubIcon size={24} />
              <span
                className={cn(
                  "absolute -right-1 -bottom-1 size-3.5 rounded-full ring-2 ring-surface",
                  loading ? "pulse-dot bg-amber-500" : data?.mode === "live" ? "bg-emerald-500" : "bg-zinc-400",
                )}
              />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-fg">GitHub · {data?.org ?? "…"}</p>
                {data && (
                  <Badge tone={data.mode === "live" ? "green" : "violet"}>{data.mode === "live" ? "Připojeno (live API)" : "Demo režim"}</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {loading
                  ? "Načítám data z GitHubu…"
                  : error
                    ? `Chyba: ${error}`
                    : data?.message ?? `Synchronizováno ${formatRelative(data?.fetchedAt ?? new Date().toISOString(), new Date())}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <Button onClick={refresh} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : undefined} /> Obnovit
            </Button>
            <a
              href={`https://github.com/${data?.org ?? ""}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-fg px-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              <GithubIcon size={14} /> Otevřít organizaci
            </a>
          </div>
        </div>
        {data?.mode === "demo" && (
          <div className="grid grid-cols-1 gap-3 border-t border-line bg-surface-2/40 px-5 py-4 text-xs text-fg-2 md:grid-cols-3">
            <Step n={1} icon={<KeyRound size={14} />} title="Vytvořte token">
              Fine-grained PAT s read-only právy <em>Contents, Metadata, Pull requests, Issues, Deployments</em>.
            </Step>
            <Step n={2} icon={<Plug size={14} />} title="Nastavte proměnné">
              Do <code className="rounded bg-surface-3 px-1 font-mono">.env.local</code> přidejte{" "}
              <code className="rounded bg-surface-3 px-1 font-mono">GITHUB_TOKEN</code> (a volitelně{" "}
              <code className="rounded bg-surface-3 px-1 font-mono">GITHUB_ORG</code>).
            </Step>
            <Step n={3} icon={<Rocket size={14} />} title="Propojte repozitáře">
              Mapování repozitář ↔ projekt je v <code className="rounded bg-surface-3 px-1 font-mono">data/repos.json</code>. Stav nasazení se čte z
              GitHub Deployments (Vercel/Netlify).
            </Step>
          </div>
        )}
      </Card>

      {/* Souhrn */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary icon={<GithubIcon size={15} />} label="Sledované repozitáře" value={stats.repos} />
        <Summary icon={<GitPullRequest size={15} />} label="Otevřené PR" value={stats.prs} />
        <Summary icon={<CircleDot size={15} />} label="Otevřené issues" value={stats.issues} />
        <Summary
          icon={<ServerCrash size={15} />}
          label="Nasazení"
          value={stats.failing ? `${stats.failing} chyba` : "Vše OK"}
          sub={stats.building ? `${stats.building} build běží` : undefined}
          danger={stats.failing > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Hledat repozitář, projekt, klienta…" className="sm:w-72" />
            <div className="flex flex-wrap items-center gap-1.5">
              {DEPLOY_FILTERS.map((s) => (
                <FilterChip key={s} active={states.includes(s)} onClick={() => toggleState(s)} count={repos.filter((r) => r.deployment.state === s).length}>
                  {DEPLOY_STATE[s].label}
                </FilterChip>
              ))}
              <FilterChip active={onlyPrs} onClick={() => setOnlyPrs((v) => !v)}>
                S otevřeným PR
              </FilterChip>
            </div>
          </div>

          {loading && !data ? (
            Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl border border-line bg-surface" />)
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState title="Žádný repozitář neodpovídá filtrům" />
            </Card>
          ) : (
            filtered.map((repo) => (
              <RepoCard
                key={repo.fullName}
                repo={repo}
                now={now}
                open={expanded === repo.fullName}
                onToggle={() => setExpanded((cur) => (cur === repo.fullName ? null : repo.fullName))}
              />
            ))
          )}
        </div>

        <Card className="h-fit xl:sticky xl:top-20">
          <CardHeader title="Aktivita napříč repozitáři" description="Commity a nové pull requesty" />
          <CardBody>
            <ol className="relative space-y-4 before:absolute before:top-1 before:bottom-1 before:left-[7px] before:w-px before:bg-line">
              {feed.map((e, i) => (
                <li key={i} className="relative flex gap-3 pl-0">
                  <span
                    className={cn(
                      "relative z-10 mt-1 size-[15px] shrink-0 rounded-full border-2 border-surface",
                      e.kind === "pr" ? "bg-emerald-500" : "bg-accent",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs text-fg">
                      {e.kind === "pr" ? "PR: " : ""}
                      <span className={e.kind === "commit" ? "font-mono" : "font-medium"}>{e.title}</span>
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {e.who} · {e.repo.fullName.split("/")[1]} · {formatRelative(e.date, now)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function RepoCard({ repo, now, open, onToggle }: { repo: Repo; now: Date; open: boolean; onToggle: () => void }) {
  const project = getProject(repo.projectId);
  const last = repo.commits[0];
  return (
    <Card className={cn("transition-colors", open && "border-line-strong")} as="article">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <RepoHeader repo={repo} now={now} />
          {project && (
            <Link href={`/projects/${project.id}`} className="mt-2 inline-block text-xs text-fg-2 hover:text-accent">
              {project.name} · {clientName(project.clientId)}
            </Link>
          )}
          {last && !open && (
            <p className="mt-2 truncate font-mono text-[11px] text-muted">
              ↳ {last.message} · {formatRelative(last.date, now)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <div className="flex gap-1.5">
            <Counter icon={<GitPullRequest size={12} />} value={repo.pullRequests.length} label="PR" />
            <Counter icon={<CircleDot size={12} />} value={repo.issues.length} label="issues" warn={repo.issues.some((i) => i.labels.includes("bug"))} />
          </div>
          <button
            onClick={onToggle}
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {open ? "Skrýt" : "Detail"}
            <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>
      {open && (
        <div className="animate-in border-t border-line px-4 pb-2">
          <RepoActivity repo={repo} now={now} />
        </div>
      )}
    </Card>
  );
}

function Counter({ icon, value, label, warn }: { icon: ReactNode; value: number; label: string; warn?: boolean }) {
  return (
    <span
      title={`${value} ${label}`}
      className={cn(
        "tabular inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        warn ? "border-red-500/30 text-red-700 dark:text-red-400" : "border-line text-fg-2",
      )}
    >
      {icon}
      {value}
    </span>
  );
}

function Summary({ icon, label, value, sub, danger }: { icon: ReactNode; label: string; value: ReactNode; sub?: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
      <div className="flex items-center justify-between text-muted">
        <span className="text-[11px]">{label}</span>
        {danger ? <TriangleAlert size={15} className="text-red-500" /> : icon}
      </div>
      <p className={cn("mt-1 text-lg font-semibold", danger ? "text-red-600 dark:text-red-400" : "text-fg")}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">{n}</span>
      <div>
        <p className="mb-0.5 inline-flex items-center gap-1.5 font-medium text-fg">
          {icon} {title}
        </p>
        <p className="leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
