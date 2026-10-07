import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { DataContext, PublicUser, User } from "@/lib/types";
import { readDb, updateDb } from "./db";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "p2_session";
const SESSION_DAYS = 30;

/* ------------------------------------------------------------------ */
/* Hesla                                                               */
/* ------------------------------------------------------------------ */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function validatePassword(password: string): string | null {
  if (password.length < 10) return "Heslo musí mít alespoň 10 znaků.";
  if (password.length > 200) return "Heslo je příliš dlouhé.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function isHttps(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "";
  const origin = h.get("origin") ?? "";
  return proto.split(",")[0].trim() === "https" || origin.startsWith("https://");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 864e5);
  await updateDb((db) => {
    // Úklid prošlých sessions
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt) > now);
    db.sessions.push({ tokenHash: hashToken(token), userId, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() });
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttps(),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await updateDb((db) => {
      db.sessions = db.sessions.filter((s) => s.tokenHash !== tokenHash);
    });
  }
  store.delete(SESSION_COOKIE);
}

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

/** Aktuálně přihlášený uživatel, nebo null */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await readDb();
  const tokenHash = hashToken(token);
  const session = db.sessions.find((s) => s.tokenHash === tokenHash);
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user ? toPublicUser(user) : null;
});

/** Vyžaduje přihlášení – jinak přesměruje na login (nebo na první nastavení) */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    const db = await readDb();
    redirect(db.users.length === 0 ? "/setup" : "/login");
  }
  return user;
}

/** Přihlášený uživatel + všechna data pro vykreslení stránky */
export const getData = cache(async (): Promise<{ me: PublicUser; ctx: DataContext }> => {
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
});

/* ------------------------------------------------------------------ */
/* Ochrana proti hádání hesel (v paměti procesu)                       */
/* ------------------------------------------------------------------ */

const attempts = new Map<string, { count: number; lockedUntil: number }>();

export function loginLockedFor(key: string): number {
  const a = attempts.get(key);
  if (!a) return 0;
  const left = a.lockedUntil - Date.now();
  return left > 0 ? Math.ceil(left / 60000) : 0;
}

export function registerFailedLogin(key: string) {
  const a = attempts.get(key) ?? { count: 0, lockedUntil: 0 };
  a.count += 1;
  if (a.count >= 5) {
    a.lockedUntil = Date.now() + 5 * 60_000;
    a.count = 0;
  }
  attempts.set(key, a);
}

export function clearFailedLogins(key: string) {
  attempts.delete(key);
}
