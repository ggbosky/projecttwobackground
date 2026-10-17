import { EMPTY_DB, normalizeDb } from "@/lib/dbShape";
import type { Database } from "@/lib/types";

/**
 * Úložiště verze pro GitHub Pages: localStorage prohlížeče.
 * Každý den se navíc uloží záloha (posledních 14 dní), kterou lze obnovit.
 */
export const DB_KEY = "p2-preview-db";
const BACKUPS_KEY = "p2-backups";
const SAVED_KEY = "p2-last-saved";
let memory: Database | null = null;

export { EMPTY_DB };

export function newId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function readDb(): Promise<Database> {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return normalizeDb(JSON.parse(raw));
  } catch {}
  return structuredClone(memory ?? EMPTY_DB);
}

interface Backup {
  date: string;
  savedAt: string;
  data: Database;
}

export function listBackups(): Backup[] {
  try {
    return JSON.parse(localStorage.getItem(BACKUPS_KEY) ?? "[]") as Backup[];
  } catch {
    return [];
  }
}

function snapshot(db: Database) {
  const today = new Date().toISOString().slice(0, 10);
  const list = listBackups().filter((b) => b.date !== today);
  list.unshift({ date: today, savedAt: new Date().toISOString(), data: db });
  try {
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(list.slice(0, 14)));
  } catch {
    // Při plném úložišti ponecháme jen nejnovější zálohy
    try {
      localStorage.setItem(BACKUPS_KEY, JSON.stringify(list.slice(0, 3)));
    } catch {}
  }
}

async function writeDb(db: Database) {
  memory = structuredClone(db);
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.setItem(SAVED_KEY, new Date().toISOString());
    snapshot(db);
  } catch {}
}

export function lastSaved(): string | null {
  try {
    return localStorage.getItem(SAVED_KEY);
  } catch {
    return null;
  }
}

export function replaceDb(data: unknown) {
  const db = normalizeDb(data as Database);
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  localStorage.setItem(SAVED_KEY, new Date().toISOString());
}

export async function updateDb<T>(mutate: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await readDb();
  const result = await mutate(db);
  await writeDb(db);
  return result;
}
