import type { DataContext, PublicUser } from "@/lib/types";
import { readDb } from "./db";

/** Verze pro GitHub Pages: bez přihlášení, „Pracuji jako“ se pamatuje v prohlížeči */
const ME_KEY = "p2-me";

export async function getData(): Promise<{ me: PublicUser | null; ctx: DataContext }> {
  const db = await readDb();
  let id: string | null = null;
  try {
    id = localStorage.getItem(ME_KEY);
  } catch {}
  const me = db.users.find((u) => u.id === id) ?? db.users[0] ?? null;
  return {
    me,
    ctx: {
      today: new Date(),
      users: db.users,
      clients: db.clients,
      projects: db.projects,
      invoices: db.invoices,
      expenses: db.expenses,
      settings: db.settings,
    },
  };
}

export async function currentMemberId(): Promise<string> {
  return (await getData()).me?.id ?? "";
}

export async function setCurrentMember(id: string): Promise<void> {
  try {
    localStorage.setItem(ME_KEY, id);
  } catch {}
}
