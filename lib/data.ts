import clientsJson from "@/data/clients.json";
import projectsJson from "@/data/projects.json";
import teamJson from "@/data/team.json";
import financeJson from "@/data/finance.json";
import reposJson from "@/data/repos.json";
import type { Client, FinanceData, Invoice, Project, Repo, TeamMember } from "./types";

/**
 * Datová vrstva dema. Vše je načteno ze statických JSON souborů v /data,
 * takže aplikace funguje okamžitě bez backendu. Pro produkční nasazení stačí
 * nahradit tyto funkce voláním API / databáze se stejnými typy.
 */

export const clients = clientsJson as Client[];
export const projects = projectsJson as Project[];
export const team = teamJson as TeamMember[];
export const finance = financeJson as FinanceData;
export const invoices: Invoice[] = finance.invoices;
export const mockRepos = reposJson.repos as Repo[];
export const githubOrg = reposJson.org;

/**
 * Referenční „dnešek“ mock dat. Díky tomu dávají metriky typu „tento měsíc“
 * smysl bez ohledu na to, kdy demo spustíte.
 */
export const REFERENCE_DATE = new Date(`${finance.referenceDate}T12:00:00Z`);
export const REFERENCE_MONTH = finance.referenceDate.slice(0, 7);

const clientById = new Map(clients.map((c) => [c.id, c]));
const projectById = new Map(projects.map((p) => [p.id, p]));
const memberById = new Map(team.map((m) => [m.id, m]));

export function getClient(id: string): Client | undefined {
  return clientById.get(id);
}

export function getProject(id: string): Project | undefined {
  return projectById.get(id);
}

export function getMember(id: string): TeamMember | undefined {
  return memberById.get(id);
}

export function getMemberByGithub(login: string): TeamMember | undefined {
  return team.find((m) => m.github === login);
}

export function clientName(id: string): string {
  return clientById.get(id)?.company ?? "Neznámý klient";
}

export function projectsForClient(clientId: string): Project[] {
  return projects.filter((p) => p.clientId === clientId);
}

export function invoicesForProject(projectId: string): Invoice[] {
  return invoices.filter((i) => i.projectId === projectId);
}

export function invoicesForClient(clientId: string): Invoice[] {
  return invoices.filter((i) => i.clientId === clientId);
}

export function repoForProject(projectId: string): Repo | undefined {
  return mockRepos.find((r) => r.projectId === projectId);
}
