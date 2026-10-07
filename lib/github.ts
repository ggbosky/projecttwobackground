import "server-only";
import { githubOrg, mockRepos } from "./data";
import type { Commit, DeployState, Deployment, GithubPayload, Issue, PullRequest, Repo } from "./types";

/**
 * Napojení na GitHub REST API.
 *
 * - Bez `GITHUB_TOKEN` vrací demo data z data/repos.json.
 * - S tokenem načte pro každý repozitář z data/repos.json živé informace:
 *   poslední commity, otevřené PR, issues a stav posledního nasazení
 *   (Deployments API – Vercel i Netlify sem zapisují statusy automaticky).
 * - `GITHUB_ORG` volitelně přepíše organizaci (např. když repozitáře
 *   máte pod jiným účtem než v mock datech).
 */

const API = "https://api.github.com";
const REVALIDATE_SECONDS = 300;

function token() {
  return process.env.GITHUB_TOKEN?.trim() || undefined;
}

export function githubMode(): "live" | "demo" {
  return token() ? "live" : "demo";
}

function orgName() {
  return process.env.GITHUB_ORG?.trim() || githubOrg;
}

function mapFullName(fullName: string) {
  const [, name] = fullName.split("/");
  return `${orgName()}/${name}`;
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "project-two-dashboard",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    const reasons: Record<number, string> = {
      401: "Neplatný nebo expirovaný GITHUB_TOKEN",
      403: "Překročen rate limit nebo chybí oprávnění tokenu",
      404: "Repozitář nenalezen nebo k němu token nemá přístup",
    };
    const reason = reasons[res.status] ?? `GitHub API ${res.status}`;
    throw new Error(reason);
  }
  return (await res.json()) as T;
}

/* --- Typy odpovědí GitHub API (jen používaná pole) --- */
interface GhRepo {
  full_name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  default_branch: string;
  pushed_at: string;
  html_url: string;
}
interface GhCommit {
  sha: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author: { login: string } | null;
}
interface GhPull {
  number: number;
  title: string;
  user: { login: string } | null;
  created_at: string;
  draft?: boolean;
  html_url: string;
}
interface GhIssue extends Omit<GhPull, "draft"> {
  labels: ({ name?: string } | string)[];
  pull_request?: unknown;
}
interface GhDeployment {
  id: number;
  environment: string;
  created_at: string;
  creator: { login: string } | null;
  statuses_url: string;
}
interface GhDeploymentStatus {
  state: string;
  environment_url?: string;
  target_url?: string;
  log_url?: string;
  created_at: string;
}

function mapState(state?: string): DeployState {
  switch (state) {
    case "success":
      return "ready";
    case "failure":
    case "error":
      return "error";
    case "in_progress":
    case "pending":
      return "building";
    case "queued":
      return "queued";
    default:
      return "none";
  }
}

function detectProvider(login?: string, url?: string): Deployment["provider"] {
  const hay = `${login ?? ""} ${url ?? ""}`.toLowerCase();
  if (hay.includes("vercel")) return "Vercel";
  if (hay.includes("netlify")) return "Netlify";
  if (hay.includes("webflow")) return "Webflow";
  return "Jiný";
}

async function fetchDeployment(fullName: string, fallback: Deployment): Promise<Deployment> {
  const deployments = await gh<GhDeployment[]>(`/repos/${fullName}/deployments?per_page=1`);
  const latest = deployments[0];
  if (!latest) return { ...fallback, state: "none", environment: "—", url: undefined, updatedAt: undefined };
  const statuses = await gh<GhDeploymentStatus[]>(`/repos/${fullName}/deployments/${latest.id}/statuses?per_page=1`);
  const status = statuses[0];
  const url = status?.environment_url || status?.target_url || undefined;
  return {
    provider: detectProvider(latest.creator?.login, url),
    state: mapState(status?.state ?? "queued"),
    environment: latest.environment,
    url,
    updatedAt: status?.created_at ?? latest.created_at,
  };
}

async function fetchRepo(mock: Repo): Promise<Repo> {
  const fullName = mapFullName(mock.fullName);
  try {
    const [repo, commits, pulls, issues] = await Promise.all([
      gh<GhRepo>(`/repos/${fullName}`),
      gh<GhCommit[]>(`/repos/${fullName}/commits?per_page=5`),
      gh<GhPull[]>(`/repos/${fullName}/pulls?state=open&per_page=10`),
      gh<GhIssue[]>(`/repos/${fullName}/issues?state=open&per_page=20`),
    ]);
    const deployment = await fetchDeployment(fullName, mock.deployment).catch(() => mock.deployment);

    return {
      fullName: repo.full_name,
      projectId: mock.projectId,
      description: repo.description ?? "",
      private: repo.private,
      language: repo.language ?? "—",
      defaultBranch: repo.default_branch,
      pushedAt: repo.pushed_at,
      url: repo.html_url,
      deployment,
      commits: commits.map<Commit>((c) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        author: c.author?.login ?? c.commit.author?.name ?? "unknown",
        date: c.commit.author?.date ?? repo.pushed_at,
      })),
      pullRequests: pulls.map<PullRequest>((p) => ({
        number: p.number,
        title: p.title,
        author: p.user?.login ?? "unknown",
        createdAt: p.created_at,
        draft: Boolean(p.draft),
        url: p.html_url,
      })),
      issues: issues
        .filter((i) => !i.pull_request)
        .slice(0, 10)
        .map<Issue>((i) => ({
          number: i.number,
          title: i.title,
          labels: i.labels.map((l) => (typeof l === "string" ? l : (l.name ?? ""))).filter(Boolean),
          createdAt: i.created_at,
          url: i.html_url,
        })),
    };
  } catch (error) {
    // Repozitář se nepodařilo načíst – ukážeme demo data s upozorněním
    return { ...mock, error: error instanceof Error ? error.message : "Neznámá chyba" };
  }
}

export async function getGithubData(filterFullName?: string): Promise<GithubPayload> {
  const repos = filterFullName ? mockRepos.filter((r) => r.fullName === filterFullName) : mockRepos;
  if (!token()) {
    return {
      mode: "demo",
      org: githubOrg,
      fetchedAt: new Date().toISOString(),
      repos,
      message: "Běží v demo režimu. Nastavte GITHUB_TOKEN pro živá data.",
    };
  }
  const live = await Promise.all(repos.map(fetchRepo));
  const failed = live.filter((r) => r.error).length;
  return {
    mode: "live",
    org: orgName(),
    fetchedAt: new Date().toISOString(),
    repos: live,
    message: failed ? `${failed} z ${live.length} repozitářů se nepodařilo načíst – zobrazena demo data.` : undefined,
  };
}
