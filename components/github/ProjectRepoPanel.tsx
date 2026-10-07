"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { RepoActivity, RepoHeader, nowFor, useGithub } from "./RepoDetails";

export function ProjectRepoPanel({ repo }: { repo: string }) {
  const { data, loading, error } = useGithub(repo);
  const r = data?.repos[0];
  return (
    <Card>
      <CardHeader
        title="GitHub repozitář"
        icon={<GithubIcon size={15} />}
        description={data ? (data.mode === "live" ? "Živá data z GitHub API" : "Demo data – nastavte GITHUB_TOKEN") : undefined}
      />
      <CardBody>
        {loading && !r ? (
          <div className="space-y-2">
            <div className="h-5 w-1/2 animate-pulse rounded bg-surface-2" />
            <div className="h-24 animate-pulse rounded bg-surface-2" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400">Nepodařilo se načíst data: {error}</p>
        ) : r ? (
          <div className="space-y-3">
            <RepoHeader repo={r} now={nowFor(data)} />
            <RepoActivity repo={r} now={nowFor(data)} compact />
          </div>
        ) : (
          <p className="text-sm text-muted">Repozitář není propojen.</p>
        )}
      </CardBody>
    </Card>
  );
}
