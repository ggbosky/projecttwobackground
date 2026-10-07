import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "@/lib/types";

/**
 * Lokální úložiště dat.
 *
 * Všechna data žijí v jediném JSON souboru na serveru, kde aplikace běží
 * (výchozí `.data/db.json`, složku lze změnit proměnnou DATA_DIR).
 * Soubor je v .gitignore – do repozitáře ani do žádné externí služby se nedostane.
 * Zápis je atomický (tmp soubor + rename) a v rámci procesu serializovaný.
 */

const DATA_DIR = process.env.DATA_DIR?.trim() || path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export const EMPTY_DB: Database = {
  version: 1,
  users: [],
  sessions: [],
  clients: [],
  projects: [],
  invoices: [],
  expenses: [],
  settings: {
    targetMonthlyRevenue: 0,
    targetMargin: 0.3,
    capacityBuffer: 0.15,
  },
};

export function newId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return { ...structuredClone(EMPTY_DB), ...parsed, settings: { ...EMPTY_DB.settings, ...parsed.settings } };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY_DB);
    throw error;
  }
}

async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), { encoding: "utf8", mode: 0o600 });
  await fs.rename(tmp, DB_FILE);
}

let queue: Promise<unknown> = Promise.resolve();

/** Načte data, nechá je upravit a atomicky uloží. Volání jsou serializovaná. */
export function updateDb<T>(mutate: (db: Database) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await mutate(db);
    await writeDb(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
