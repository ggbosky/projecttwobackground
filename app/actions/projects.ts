"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { newId, updateDb } from "@/lib/server/db";
import { clamp, date, json, list, num, numOrNull, oneOf, str, text } from "@/lib/server/form";
import type { ActionState, Allocation, Project, ProjectStatus, WebType } from "@/lib/types";

const STATUSES: ProjectStatus[] = ["proposal", "in_progress", "on_hold", "completed", "cancelled", "lost"];
const TYPES: WebType[] = ["eshop", "presentation", "webflow", "custom"];

export async function saveProjectAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(fd, "id", 40);
  const name = str(fd, "name", 200);
  const clientId = str(fd, "clientId", 40);
  if (!name) return { error: "Vyplňte název projektu." };
  if (!clientId) return { error: "Vyberte klienta." };

  const status = oneOf(fd, "status", STATUSES, "proposal");
  const rawTeam = json<Partial<Allocation>[]>(fd, "team", []);
  const team: Allocation[] = (Array.isArray(rawTeam) ? rawTeam : [])
    .filter((a) => typeof a.memberId === "string" && a.memberId)
    .map((a) => ({ memberId: String(a.memberId).slice(0, 40), hoursPerWeek: clamp(Number(a.hoursPerWeek) || 0, 0, 80) }));
  const rating = numOrNull(fd, "rating");

  const fields = {
    name,
    clientId,
    type: oneOf(fd, "type", TYPES, "presentation"),
    status,
    description: text(fd, "description"),
    stack: list(fd, "stack"),
    price: Math.max(0, num(fd, "price")),
    probability: clamp(num(fd, "probability", 50), 0, 100) / 100,
    startDate: date(fd, "startDate"),
    plannedEndDate: date(fd, "plannedEndDate"),
    actualEndDate: date(fd, "actualEndDate"),
    estimatedHours: Math.max(0, num(fd, "estimatedHours")),
    actualHours: Math.max(0, num(fd, "actualHours")),
    externalCosts: Math.max(0, num(fd, "externalCosts")),
    progress: status === "completed" ? 100 : clamp(Math.round(num(fd, "progress")), 0, 100),
    team,
    liveUrl: str(fd, "liveUrl", 300),
    outcomeReasons: list(fd, "outcomeReasons"),
    rating: rating && rating > 0 ? clamp(Math.round(rating), 1, 5) : null,
    feedback: text(fd, "feedback"),
    holdReason: text(fd, "holdReason"),
  };

  const now = new Date().toISOString();
  const savedId = await updateDb((db) => {
    if (!db.clients.some((c) => c.id === clientId)) return null;
    if (id) {
      const p = db.projects.find((x) => x.id === id);
      if (!p) return null;
      Object.assign(p, fields, { updatedAt: now });
      return p.id;
    }
    const project: Project = { id: newId(), createdAt: now, updatedAt: now, ...fields };
    db.projects.push(project);
    // Podepsaná zakázka z leadu → aktivní klient
    const client = db.clients.find((c) => c.id === clientId);
    if (client && client.status === "lead" && ["in_progress", "completed"].includes(status)) client.status = "active";
    return project.id;
  });
  if (!savedId) return { error: "Projekt nebo klient nebyl nalezen." };
  revalidatePath("/", "layout");
  redirect(`/projects/${savedId}`);
}

export async function deleteProjectAction(id: string): Promise<void> {
  await requireUser();
  await updateDb((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
    db.invoices.forEach((i) => {
      if (i.projectId === id) i.projectId = "";
    });
  });
  revalidatePath("/", "layout");
  redirect("/projects");
}
