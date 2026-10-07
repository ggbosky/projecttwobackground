"use server";

import { redirect } from "next/navigation";
import {
  clearFailedLogins,
  createSession,
  destroySession,
  hashPassword,
  loginLockedFor,
  registerFailedLogin,
  validatePassword,
  verifyPassword,
} from "@/lib/server/auth";
import { newId, readDb, updateDb } from "@/lib/server/db";
import { str } from "@/lib/server/form";
import { MEMBER_COLORS } from "@/lib/status";
import type { ActionState } from "@/lib/types";


/** První spuštění – vytvoří úvodní účet (jen pokud ještě žádný neexistuje) */
export async function setupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const name = str(fd, "name", 80);
  const email = str(fd, "email", 120).toLowerCase();
  const password = str(fd, "password", 200);
  if (!name || !email.includes("@")) return { error: "Vyplňte jméno a platný e-mail." };
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };
  if (password !== str(fd, "password2", 200)) return { error: "Hesla se neshodují." };

  const passwordHash = await hashPassword(password);
  const created = await updateDb((db) => {
    if (db.users.length > 0) return null;
    const user = {
      id: newId(),
      name,
      email,
      role: str(fd, "role", 80) || "Co-founder",
      passwordHash,
      hoursPerWeek: 40,
      hourlyCost: 0,
      color: MEMBER_COLORS[0],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  });
  if (!created) return { error: "Účet už existuje – přihlaste se." };
  await createSession(created.id);
  redirect("/");
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email", 120).toLowerCase();
  const password = str(fd, "password", 200);
  const locked = loginLockedFor(email);
  if (locked) return { error: `Příliš mnoho pokusů. Zkuste to znovu za ${locked} min.` };

  const db = await readDb();
  const user = db.users.find((u) => u.email === email);
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    registerFailedLogin(email);
    return { error: "Nesprávný e-mail nebo heslo." };
  }
  clearFailedLogins(email);
  await createSession(user.id);
  const next = str(fd, "next", 200);
  redirect(/^\/(?![\/\\])/.test(next) ? next : "/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
