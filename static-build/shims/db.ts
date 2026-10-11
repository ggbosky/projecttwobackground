import type { Database } from "@/lib/types";

const KEY = "p2-preview-db";
let memory: Database | null = null;

export const EMPTY_DB: Database = {
  version: 1,
  users: [],
  sessions: [],
  clients: [],
  projects: [],
  invoices: [],
  expenses: [],
  settings: { targetMonthlyRevenue: 0, targetMargin: 0.3, capacityBuffer: 0.15 },
};

export function newId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function readDb(): Promise<Database> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...structuredClone(EMPTY_DB), ...JSON.parse(raw) };
  } catch {}
  return structuredClone(memory ?? EMPTY_DB);
}

async function writeDb(db: Database) {
  memory = structuredClone(db);
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {}
}

export async function updateDb<T>(mutate: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await readDb();
  const result = await mutate(db);
  await writeDb(db);
  return result;
}
