import type { Database } from "./types";

/** Výchozí prázdná data a normalizace (sdílené serverem i verzí pro GitHub Pages) */
export const EMPTY_DB: Database = {
  version: 1,
  users: [],
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

/** Doplní chybějící pole a odstraní pozůstatky staršího přihlašování (hesla, sessions) */
export function normalizeDb(parsed: Partial<Database> & { sessions?: unknown }): Database {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sessions, ...rest } = parsed ?? {};
  const db: Database = { ...structuredClone(EMPTY_DB), ...rest, settings: { ...EMPTY_DB.settings, ...parsed?.settings } };
  db.users = (db.users ?? []).map((u) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...user } = u as typeof u & { passwordHash?: string };
    return user;
  });
  db.clients = (db.clients ?? []).map((c) => ({ ...c, interest: c.interest ?? "" }));
  db.projects = (db.projects ?? []).map((p) => ({ ...p, package: p.package ?? "" }));
  return db;
}
