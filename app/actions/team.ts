"use server";

import { revalidatePath } from "next/cache";
import { hashPassword, requireUser, validatePassword, verifyPassword } from "@/lib/server/auth";
import { newId, updateDb } from "@/lib/server/db";
import { clamp, num, str } from "@/lib/server/form";
import { MEMBER_COLORS } from "@/lib/status";
import type { ActionState } from "@/lib/types";

/** Přidání kolegy – vytvoří účet s dočasným heslem, které si pak změní v Nastavení */
export async function addMemberAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const name = str(fd, "name", 80);
  const email = str(fd, "email", 120).toLowerCase();
  const password = str(fd, "password", 200);
  if (!name || !email.includes("@")) return { error: "Vyplňte jméno a platný e-mail." };
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };
  const passwordHash = await hashPassword(password);
  const error = await updateDb((db) => {
    if (db.users.some((u) => u.email === email)) return "Uživatel s tímto e-mailem už existuje.";
    db.users.push({
      id: newId(),
      name,
      email,
      role: str(fd, "role", 80),
      passwordHash,
      hoursPerWeek: clamp(num(fd, "hoursPerWeek", 40), 0, 80),
      hourlyCost: Math.max(0, num(fd, "hourlyCost")),
      color: MEMBER_COLORS[db.users.length % MEMBER_COLORS.length],
      createdAt: new Date().toISOString(),
    });
    return null;
  });
  if (error) return { error };
  revalidatePath("/", "layout");
  return { ok: true, message: `Účet pro ${name} vytvořen. Předejte mu e-mail a dočasné heslo.` };
}

export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const name = str(fd, "name", 80);
  const email = str(fd, "email", 120).toLowerCase();
  if (!name || !email.includes("@")) return { error: "Vyplňte jméno a platný e-mail." };
  const error = await updateDb((db) => {
    if (db.users.some((u) => u.email === email && u.id !== me.id)) return "Tento e-mail už používá jiný účet.";
    const u = db.users.find((x) => x.id === me.id);
    if (!u) return "Účet nebyl nalezen.";
    u.name = name;
    u.email = email;
    u.role = str(fd, "role", 80);
    u.hoursPerWeek = clamp(num(fd, "hoursPerWeek", 40), 0, 80);
    u.hourlyCost = Math.max(0, num(fd, "hourlyCost"));
    const color = str(fd, "color", 10);
    if (MEMBER_COLORS.includes(color)) u.color = color;
    return null;
  });
  if (error) return { error };
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil uložen." };
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const current = str(fd, "current", 200);
  const next = str(fd, "password", 200);
  const pwError = validatePassword(next);
  if (pwError) return { error: pwError };
  if (next !== str(fd, "password2", 200)) return { error: "Nová hesla se neshodují." };
  const hash = await hashPassword(next);
  const error = await updateDb(async (db) => {
    const u = db.users.find((x) => x.id === me.id);
    if (!u) return "Účet nebyl nalezen.";
    if (!(await verifyPassword(current, u.passwordHash))) return "Současné heslo není správné.";
    u.passwordHash = hash;
    return null;
  });
  if (error) return { error };
  return { ok: true, message: "Heslo změněno." };
}

export async function removeMemberAction(id: string): Promise<void> {
  const me = await requireUser();
  if (id === me.id) return;
  await updateDb((db) => {
    db.users = db.users.filter((u) => u.id !== id);
    db.sessions = db.sessions.filter((s) => s.userId !== id);
    db.projects.forEach((p) => {
      p.team = p.team.filter((a) => a.memberId !== id);
    });
  });
  revalidatePath("/", "layout");
}
