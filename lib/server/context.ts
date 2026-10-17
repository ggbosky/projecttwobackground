import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { DataContext, PublicUser } from "@/lib/types";
import { readDb } from "./db";

/**
 * Aplikace je otevřená – bez přihlašování. „Kdo právě pracuje“ se jen pamatuje
 * v cookie (výběr v menu), aby šlo předvyplnit autora záznamů a vlastníka klienta.
 */
const ME_COOKIE = "p2_me";

/** Aktuální člen týmu + všechna data pro vykreslení stránky */
export const getData = cache(async (): Promise<{ me: PublicUser | null; ctx: DataContext }> => {
  const db = await readDb();
  const id = (await cookies()).get(ME_COOKIE)?.value;
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
});

export async function currentMemberId(): Promise<string> {
  const { me } = await getData();
  return me?.id ?? "";
}

export async function setCurrentMember(id: string): Promise<void> {
  (await cookies()).set(ME_COOKIE, id, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}
