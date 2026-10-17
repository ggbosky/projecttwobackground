"use server";

import { revalidatePath } from "next/cache";
import { setCurrentMember } from "@/lib/server/context";
import { newId, updateDb } from "@/lib/server/db";
import { clamp, num, str } from "@/lib/server/form";
import { MEMBER_COLORS } from "@/lib/status";
import type { ActionState } from "@/lib/types";

/** Přidání člena týmu (bez hesla – aplikace je otevřená) */
export async function addMemberAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const name = str(fd, "name", 80);
  if (!name) return { error: "Vyplňte jméno." };
  let id = "";
  await updateDb((db) => {
    id = newId();
    db.users.push({
      id,
      name,
      email: str(fd, "email", 120).toLowerCase(),
      role: str(fd, "role", 80),
      hoursPerWeek: clamp(num(fd, "hoursPerWeek", 40), 0, 80),
      hourlyCost: Math.max(0, num(fd, "hourlyCost")),
      color: MEMBER_COLORS[db.users.length % MEMBER_COLORS.length],
      createdAt: new Date().toISOString(),
    });
  });
  // První přidaný člen se rovnou stane „mnou“
  if (str(fd, "makeMe", 5) === "on") await setCurrentMember(id);
  revalidatePath("/", "layout");
  return { ok: true, message: `${name} přidán(a) do týmu.` };
}

export async function updateMemberAction(memberId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const name = str(fd, "name", 80);
  if (!name) return { error: "Vyplňte jméno." };
  const error = await updateDb((db) => {
    const u = db.users.find((x) => x.id === memberId);
    if (!u) return "Člen týmu nebyl nalezen.";
    u.name = name;
    u.email = str(fd, "email", 120).toLowerCase();
    u.role = str(fd, "role", 80);
    u.hoursPerWeek = clamp(num(fd, "hoursPerWeek", 40), 0, 80);
    u.hourlyCost = Math.max(0, num(fd, "hourlyCost"));
    const color = str(fd, "color", 10);
    if (MEMBER_COLORS.includes(color)) u.color = color;
    return null;
  });
  if (error) return { error };
  revalidatePath("/", "layout");
  return { ok: true, message: "Uloženo." };
}

export async function removeMemberAction(id: string): Promise<void> {
  await updateDb((db) => {
    db.users = db.users.filter((u) => u.id !== id);
    db.projects.forEach((p) => {
      p.team = p.team.filter((a) => a.memberId !== id);
    });
  });
  revalidatePath("/", "layout");
}

/** Přepnutí „Pracuji jako“ – jen pro předvyplnění autora a vlastníka */
export async function setMeAction(id: string): Promise<void> {
  await setCurrentMember(id);
  revalidatePath("/", "layout");
}
