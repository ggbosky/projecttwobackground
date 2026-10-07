"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { newId, updateDb } from "@/lib/server/db";
import { clamp, date, json, list, num, numOrNull, oneOf, str, text } from "@/lib/server/form";
import type { ActionState, Client, ClientStatus, CommunicationType, CompanySize, ContactPerson, Priority, Timeline } from "@/lib/types";

const STATUSES: ClientStatus[] = ["lead", "active", "former"];
const PRIORITIES: Priority[] = ["A", "B", "C"];
const SIZES: CompanySize[] = ["", "1", "2-10", "11-50", "51-200", "200+"];
const TIMELINES: Timeline[] = ["", "asap", "1-3m", "3-6m", "6m+"];
const COMM_TYPES: CommunicationType[] = ["email", "call", "meeting", "note"];

function done() {
  revalidatePath("/", "layout");
}

/** Vytvoření i úprava klienta (podle skrytého pole `id`) */
export async function saveClientAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const id = str(fd, "id", 40);
  const company = str(fd, "company", 160);
  if (!company) return { error: "Vyplňte název firmy / klienta." };

  const rawContacts = json<Partial<ContactPerson>[]>(fd, "contacts", []);
  const contacts: ContactPerson[] = (Array.isArray(rawContacts) ? rawContacts : [])
    .slice(0, 30)
    .map((c) => ({
      id: typeof c.id === "string" && c.id ? c.id.slice(0, 40) : newId(),
      name: String(c.name ?? "").trim().slice(0, 120),
      role: String(c.role ?? "").trim().slice(0, 120),
      email: String(c.email ?? "").trim().slice(0, 160),
      phone: String(c.phone ?? "").trim().slice(0, 60),
      linkedin: String(c.linkedin ?? "").trim().slice(0, 300),
      isDecisionMaker: Boolean(c.isDecisionMaker),
      note: String(c.note ?? "").trim().slice(0, 2000),
    }))
    .filter((c) => c.name || c.email || c.phone);

  const retainerMonthly = num(fd, "retainerMonthly");
  const fields = {
    company,
    ico: str(fd, "ico", 20),
    dic: str(fd, "dic", 20),
    industry: str(fd, "industry", 120),
    size: oneOf(fd, "size", SIZES, ""),
    annualRevenue: numOrNull(fd, "annualRevenue"),
    website: str(fd, "website", 300),
    street: str(fd, "street", 200),
    city: str(fd, "city", 120),
    zip: str(fd, "zip", 20),
    country: str(fd, "country", 80) || "Česko",
    status: oneOf(fd, "status", STATUSES, "lead"),
    source: str(fd, "source", 120),
    ownerId: str(fd, "ownerId", 40) || me.id,
    priority: oneOf(fd, "priority", PRIORITIES, "B"),
    tags: list(fd, "tags"),
    since: date(fd, "since"),
    contacts,
    qualification: {
      budgetMin: numOrNull(fd, "budgetMin"),
      budgetMax: numOrNull(fd, "budgetMax"),
      needs: text(fd, "needs"),
      painPoints: text(fd, "painPoints"),
      decisionProcess: text(fd, "decisionProcess"),
      timeline: oneOf(fd, "timeline", TIMELINES, ""),
      fit: clamp(Math.round(num(fd, "fit")), 0, 5),
      competitors: str(fd, "competitors", 500),
      whyUs: text(fd, "whyUs"),
    },
    digital: {
      currentWebsite: str(fd, "currentWebsite", 300),
      platform: str(fd, "platform", 120),
      websiteAge: str(fd, "websiteAge", 60),
      instagram: str(fd, "instagram", 300),
      facebook: str(fd, "facebook", 300),
      linkedin: str(fd, "linkedinCompany", 300),
      goals: text(fd, "goals"),
      kpis: text(fd, "kpis"),
    },
    billingEmail: str(fd, "billingEmail", 160),
    paymentTermsDays: clamp(Math.round(num(fd, "paymentTermsDays", 14)), 0, 365),
    retainer:
      retainerMonthly > 0
        ? { monthly: retainerMonthly, since: date(fd, "retainerSince"), until: date(fd, "retainerUntil"), scope: str(fd, "retainerScope", 500) }
        : null,
    personality: text(fd, "personality"),
    notes: text(fd, "notes"),
  };

  const now = new Date().toISOString();
  const savedId = await updateDb((db) => {
    if (id) {
      const existing = db.clients.find((c) => c.id === id);
      if (!existing) return null;
      Object.assign(existing, fields, { updatedAt: now });
      return existing.id;
    }
    const client: Client = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      createdBy: me.id,
      ...fields,
      since: fields.since || now.slice(0, 10),
      communication: [],
      tasks: [],
    };
    db.clients.push(client);
    return client.id;
  });
  if (!savedId) return { error: "Klient nebyl nalezen (mohl být smazán)." };
  done();
  redirect(`/clients/${savedId}`);
}

export async function deleteClientAction(id: string): Promise<void> {
  await requireUser();
  await updateDb((db) => {
    db.clients = db.clients.filter((c) => c.id !== id);
    const projectIds = new Set(db.projects.filter((p) => p.clientId === id).map((p) => p.id));
    db.projects = db.projects.filter((p) => p.clientId !== id);
    db.invoices = db.invoices.filter((i) => i.clientId !== id && !projectIds.has(i.projectId));
  });
  done();
  redirect("/clients");
}

export async function setClientStatusAction(id: string, status: ClientStatus): Promise<void> {
  await requireUser();
  if (!STATUSES.includes(status)) return;
  await updateDb((db) => {
    const c = db.clients.find((x) => x.id === id);
    if (c) {
      c.status = status;
      c.updatedAt = new Date().toISOString();
    }
  });
  done();
}

/* ---------------- Komunikace ---------------- */

export async function addCommunicationAction(clientId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const summary = text(fd, "summary");
  if (!summary) return { error: "Napište shrnutí." };
  const day = date(fd, "date") || new Date().toISOString().slice(0, 10);
  const found = await updateDb((db) => {
    const c = db.clients.find((x) => x.id === clientId);
    if (!c) return false;
    c.communication.push({
      id: newId(),
      date: `${day}T${new Date().toISOString().slice(11)}`,
      type: oneOf(fd, "type", COMM_TYPES, "note"),
      authorId: str(fd, "authorId", 40) || me.id,
      summary,
      nextStep: str(fd, "nextStep", 500),
    });
    c.updatedAt = new Date().toISOString();
    return true;
  });
  if (!found) return { error: "Klient nebyl nalezen." };
  done();
  return { ok: true };
}

export async function deleteCommunicationAction(clientId: string, entryId: string): Promise<void> {
  await requireUser();
  await updateDb((db) => {
    const c = db.clients.find((x) => x.id === clientId);
    if (c) c.communication = c.communication.filter((e) => e.id !== entryId);
  });
  done();
}

/* ---------------- Úkoly ---------------- */

export async function addTaskAction(clientId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const title = str(fd, "title", 300);
  if (!title) return { error: "Napište, co je potřeba udělat." };
  const found = await updateDb((db) => {
    const c = db.clients.find((x) => x.id === clientId);
    if (!c) return false;
    c.tasks.push({
      id: newId(),
      title,
      dueDate: date(fd, "dueDate"),
      assigneeId: str(fd, "assigneeId", 40) || me.id,
      done: false,
      createdAt: new Date().toISOString(),
    });
    return true;
  });
  if (!found) return { error: "Klient nebyl nalezen." };
  done();
  return { ok: true };
}

export async function toggleTaskAction(clientId: string, taskId: string): Promise<void> {
  await requireUser();
  await updateDb((db) => {
    const t = db.clients.find((x) => x.id === clientId)?.tasks.find((x) => x.id === taskId);
    if (t) {
      t.done = !t.done;
      t.doneAt = t.done ? new Date().toISOString() : undefined;
    }
  });
  done();
}

export async function deleteTaskAction(clientId: string, taskId: string): Promise<void> {
  await requireUser();
  await updateDb((db) => {
    const c = db.clients.find((x) => x.id === clientId);
    if (c) c.tasks = c.tasks.filter((t) => t.id !== taskId);
  });
  done();
}

