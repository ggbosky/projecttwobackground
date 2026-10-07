"use client";

import { CircleDot, ExternalLink, GitCommitHorizontal, GitPullRequest, Lock, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { DeployBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { REFERENCE_DATE, getMemberByGithub } from "@/lib/data";
import { formatRelative } from "@/lib/format";
import type { GithubPayload, Repo } from "@/lib/types";

/** Načte data z /api/github (server drží token, klient dostane normalizovaná data). */
export function useGithub(repo?: string) {
  const [data, setData] = useState<GithubPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/github${repo ? `?repo=${encodeURIComponent(repo)}` : ""}`, { cache: nonce ? "no-store" : "default" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<GithubPayload>;
      })
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [repo, nonce]);

  return { data, loading, error, refresh: () => setNonce((n) => n + 1) };
}

export function nowFor(data: GithubPayload | null): Date {
  return data?.mode === "live" ? new Date(data.fetchedAt) : REFERENCE_DATE;
}

type Tab = "commits" | "prs" | "issues";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  CSS: "#663399",
  HTML: "#e34c26",
  PHP: "#4F5D95",
  Liquid: "#67b8de",
};

export function RepoActivity({ repo, now, compact = false }: { repo: Repo; now: Date; compact?: boolean }) {
  const [tab, setTab] = useState<Tab>("commits");
  const tabs: { id: Tab; label: string; count: number; icon: typeof GitCommitHorizontal }[] = [
    { id: "commits", label: "Commity", count: repo.commits.length, icon: GitCommitHorizontal },
    { id: "prs", label: "Pull requesty", count: repo.pullRequests.length, icon: GitPullRequest },
    { id: "issues", label: "Issues", count: repo.issues.length, icon: CircleDot },
  ];

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-medium transition-colors",
              tab === t.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            <t.icon size={13} />
            {t.label}
            <span className="tabular rounded bg-surface-2 px-1 text-[10px] text-muted">{t.count}</span>
          </button>
        ))}
      </div>

      <ul className={cn("divide-y divide-line", compact ? "" : "min-h-[120px]")}>
        {tab === "commits" &&
          repo.commits.map((c) => {
            const member = getMemberByGithub(c.author);
            return (
              <li key={c.sha} className="flex items-start gap-3 py-2.5">
                <Avatar name={member?.name ?? c.author} color={member?.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <a
                    href={`${repo.url}/commit/${c.sha}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-mono text-xs text-fg hover:text-accent"
                  >
                    {c.message}
                  </a>
                  <p className="text-[11px] text-muted">
                    {member?.name ?? c.author} · <span className="font-mono">{c.sha.slice(0, 7)}</span> · {formatRelative(c.date, now)}
                  </p>
                </div>
              </li>
            );
          })}
        {tab === "prs" &&
          (repo.pullRequests.length ? (
            repo.pullRequests.map((p) => (
              <li key={p.number} className="flex items-start gap-3 py-2.5">
                <GitPullRequest size={15} className={cn("mt-0.5 shrink-0", p.draft ? "text-muted" : "text-emerald-600 dark:text-emerald-400")} />
                <div className="min-w-0 flex-1">
                  <a
                    href={p.url ?? `${repo.url}/pull/${p.number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs font-medium text-fg hover:text-accent"
                  >
                    {p.title}
                  </a>
                  <p className="text-[11px] text-muted">
                    #{p.number} · {p.author} · otevřeno {formatRelative(p.createdAt, now)}
                    {p.draft && <span className="ml-1.5 rounded border border-line px-1 text-[10px]">Draft</span>}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="py-6 text-center text-xs text-muted">Žádné otevřené pull requesty 🎉</li>
          ))}
        {tab === "issues" &&
          (repo.issues.length ? (
            repo.issues.map((i) => (
              <li key={i.number} className="flex items-start gap-3 py-2.5">
                <CircleDot size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <a
                    href={i.url ?? `${repo.url}/issues/${i.number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs font-medium text-fg hover:text-accent"
                  >
                    {i.title}
                  </a>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted">
                    #{i.number} · {formatRelative(i.createdAt, now)}
                    {i.labels.map((l) => (
                      <span
                        key={l}
                        className={cn(
                          "rounded-full border px-1.5 text-[10px]",
                          ["bug", "high"].includes(l)
                            ? "border-red-500/30 text-red-700 dark:text-red-400"
                            : "border-line text-fg-2",
                        )}
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="py-6 text-center text-xs text-muted">Žádné otevřené issues</li>
          ))}
      </ul>
    </div>
  );
}

export function RepoHeader({ repo, now }: { repo: Repo; now: Date }) {
  const name = repo.fullName.split("/")[1];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-fg hover:text-accent"
        >
          {repo.private && <Lock size={12} className="text-muted" />}
          {name}
          <ExternalLink size={12} className="text-muted" />
        </a>
        <DeployBadge state={repo.deployment.state} provider={repo.deployment.provider} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ background: LANGUAGE_COLORS[repo.language] ?? "var(--muted)" }} />
          {repo.language}
        </span>
        <span>branch {repo.defaultBranch}</span>
        <span>push {formatRelative(repo.pushedAt, now)}</span>
        {repo.deployment.url && (
          <a href={repo.deployment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">
            {repo.deployment.environment} <ExternalLink size={10} />
          </a>
        )}
      </div>
      {repo.error && (
        <p className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <TriangleAlert size={12} /> {repo.error} – zobrazena demo data
        </p>
      )}
    </div>
  );
}
