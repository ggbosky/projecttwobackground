import type { DataContext, PublicUser, User } from "@/lib/types";
import { readDb } from "./db";
import { navigate } from "./router";

/** Náhled: přihlášení se drží v localStorage tohoto prohlížeče */
const SESSION_KEY = "p2-preview-session";
export const SESSION_COOKIE = "p2_session";

export class AuthRedirect extends Error {}

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16)).join("");
  return `sha256$${salt}$${await sha(salt + password)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, salt, hash] = stored.split("$");
  return (await sha(salt + password)) === hash;
}

export function validatePassword(password: string): string | null {
  if (password.length < 10) return "Heslo musí mít alespoň 10 znaků.";
  return null;
}

function getSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return (globalThis as { __p2s?: string }).__p2s ?? null;
  }
}

export async function createSession(userId: string) {
  try {
    localStorage.setItem(SESSION_KEY, userId);
  } catch {
    (globalThis as { __p2s?: string }).__p2s = userId;
  }
}

export async function destroySession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    (globalThis as { __p2s?: string }).__p2s = undefined;
  }
}

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const id = getSession();
  if (!id) return null;
  const db = await readDb();
  const user = db.users.find((u) => u.id === id);
  return user ? toPublicUser(user) : null;
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    const db = await readDb();
    navigate(db.users.length === 0 ? "/setup" : "/login", { replace: true });
    throw new AuthRedirect();
  }
  return user;
}

export async function getData(): Promise<{ me: PublicUser; ctx: DataContext }> {
  const me = await requireUser();
  const db = await readDb();
  return {
    me,
    ctx: {
      today: new Date(),
      users: db.users.map(toPublicUser),
      clients: db.clients,
      projects: db.projects,
      invoices: db.invoices,
      expenses: db.expenses,
      settings: db.settings,
    },
  };
}

export function loginLockedFor() {
  return 0;
}
export function registerFailedLogin() {}
export function clearFailedLogins() {}
