"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentMemberId } from "@/lib/server/context";
import { newId, updateDb } from "@/lib/server/db";
import { clamp, date, json, list, num, numOrNull, oneOf, str, text } from "@/lib/server/form";
import { REFERENCES } from "@/lib/agency";
import type { ActionState, Client, ClientStatus, CommunicationType, CompanySize, ContactPerson, Database, Invoice, Priority, Project, Timeline, WebType } from "@/lib/types";

const STATUSES: ClientStatus[] = ["lead", "active", "former"];
const PRIORITIES: Priority[] = ["A", "B", "C"];
const SIZES: CompanySize[] = ["", "1", "2-10", "11-50", "51-200", "200+"];
const TIMELINES: Timeline[] = ["", "asap", "1-3m", "3-6m", "6m+"];
const COMM_TYPES: CommunicationType[] = ["email", "call", "meeting", "note"];
const WEB_TYPES: WebType[] = ["eshop", "presentation", "webflow", "custom"];
const PAY_MODES = ["once", "monthly", "both"] as const;

function done() {
  revalidatePath("/", "layout");
}

/** Vytvoření i úprava klienta (podle skrytého pole `id`) */
export async function saveClientAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const meId = await currentMemberId();
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
    ownerId: str(fd, "ownerId", 40) || meId,
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
    interest: str(fd, "interest", 80),
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
      createdBy: meId,
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
  const meId = await currentMemberId();
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
      authorId: str(fd, "authorId", 40) || meId,
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
  await updateDb((db) => {
    const c = db.clients.find((x) => x.id === clientId);
    if (c) c.communication = c.communication.filter((e) => e.id !== entryId);
  });
  done();
}

/* ---------------- Úkoly ---------------- */

export async function addTaskAction(clientId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const meId = await currentMemberId();
  const title = str(fd, "title", 300);
  if (!title) return { error: "Napište, co je potřeba udělat." };
  const found = await updateDb((db) => {
    const c = db.clients.find((x) => x.id === clientId);
    if (!c) return false;
    c.tasks.push({
      id: newId(),
      title,
      dueDate: date(fd, "dueDate"),
      assigneeId: str(fd, "assigneeId", 40) || meId,
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
  await updateDb((db) => {
    const c = db.clients.find((x) => x.id === clientId);
    if (c) c.tasks = c.tasks.filter((t) => t.id !== taskId);
  });
  done();
}


/** Přidá vybrané reference z webu projectwo.com jako klienty (přeskočí už existující) */
export async function importReferencesAction(keys: string[]): Promise<{ added: number }> {
  const meId = await currentMemberId();
  const now = new Date().toISOString();
  const added = await updateDb((db) => {
    let count = 0;
    for (const ref of REFERENCES.filter((r) => keys.includes(r.key))) {
      if (db.clients.some((c) => c.website === ref.website || c.company === ref.company)) continue;
      db.clients.push({
        id: newId(),
        createdAt: now,
        updatedAt: now,
        createdBy: meId,
        company: ref.company,
        ico: "",
        dic: "",
        industry: ref.industry,
        size: "1",
        annualRevenue: null,
        website: ref.website,
        street: "",
        city: "",
        zip: "",
        country: "Česko",
        status: "active",
        source: "Reference na projectwo.com",
        ownerId: meId,
        priority: "B",
        tags: ["Reference na webu"],
        since: now.slice(0, 10),
        contacts: [
          { id: newId(), name: ref.contact, role: ref.role, email: "", phone: "", linkedin: "", isDecisionMaker: true, note: "" },
        ],
        qualification: { budgetMin: null, budgetMax: null, needs: ref.project, painPoints: "", decisionProcess: "", timeline: "", fit: 0, competitors: "", whyUs: "" },
        digital: { currentWebsite: ref.website, platform: "", websiteAge: "", instagram: "", facebook: "", linkedin: "", goals: "", kpis: "" },
        interest: "Nový web",
        billingEmail: "",
        paymentTermsDays: 14,
        retainer: null,
        personality: "",
        notes: `Recenze na webu: „${ref.quote}“`,
        communication: [],
        tasks: [],
      });
      count++;
    }
    return count;
  });
  done();
  return { added };
}

/* ---------------- Hotový klient (klient + hotová zakázka + platby) ---------------- */

function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(day: string, months: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function pushInvoice(db: Database, inv: Omit<Invoice, "id" | "number" | "createdAt">) {
  const year = inv.issueDate.slice(0, 4);
  const seq = db.invoices.filter((i) => i.number.startsWith(`FV-${year}-`)).length + 1;
  db.invoices.push({ id: newId(), number: `FV-${year}-${String(seq).padStart(4, "0")}`, createdAt: new Date().toISOString(), ...inv });
}

/**
 * Rychlé přidání klienta, pro kterého už máme hotovo: uloží klienta,
 * dokončený projekt s cenou a platbu (jednorázovou a/nebo měsíční paušál).
 */
export async function addFinishedClientAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const meId = await currentMemberId();
  const company = str(fd, "company", 160);
  if (!company) return { error: "Vyplňte jméno klienta nebo firmy." };

  const mode = oneOf(fd, "payMode", PAY_MODES, "once");
  const once = mode !== "monthly";
  const monthly = mode !== "once";
  const amount = Math.max(0, num(fd, "amount"));
  const monthlyAmount = Math.max(0, num(fd, "monthlyAmount"));
  if (once && amount <= 0) return { error: "Zadejte, kolik jsme za zakázku dostali." };
  if (monthly && monthlyAmount <= 0) return { error: "Zadejte, kolik platí měsíčně." };

  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const finished = date(fd, "finishedDate") || today;
  const paid = str(fd, "paidState", 10) !== "pending";
  const monthlySince = date(fd, "monthlySince") || finished;
  const monthsPaid = clamp(Math.round(num(fd, "monthsPaid")), 0, 120);
  const projectName = str(fd, "projectName", 200) || "Web";
  const rating = clamp(Math.round(num(fd, "rating")), 0, 5);
  const website = str(fd, "website", 300);
  const contactName = str(fd, "contactName", 120);
  const contactEmail = str(fd, "contactEmail", 160);
  const contactPhone = str(fd, "contactPhone", 60);
  const terms = 14;

  const clientId = await updateDb((db) => {
    const client: Client = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      createdBy: meId,
      company,
      ico: str(fd, "ico", 20),
      dic: "",
      industry: str(fd, "industry", 120),
      size: "",
      annualRevenue: null,
      website,
      street: "",
      city: str(fd, "city", 120),
      zip: "",
      country: "Česko",
      status: oneOf(fd, "status", ["active", "former"] as const, "active"),
      source: str(fd, "source", 120),
      ownerId: meId,
      priority: "B",
      tags: [],
      since: once ? date(fd, "startDate") || finished : monthlySince,
      contacts:
        contactName || contactEmail || contactPhone
          ? [{ id: newId(), name: contactName, role: "", email: contactEmail, phone: contactPhone, linkedin: "", isDecisionMaker: true, note: "" }]
          : [],
      qualification: { budgetMin: null, budgetMax: null, needs: "", painPoints: "", decisionProcess: "", timeline: "", fit: 0, competitors: "", whyUs: "" },
      digital: { currentWebsite: website, platform: "", websiteAge: "", instagram: "", facebook: "", linkedin: "", goals: "", kpis: "" },
      interest: once ? "Nový web" : "Péče o web",
      billingEmail: contactEmail,
      paymentTermsDays: terms,
      retainer: monthly ? { monthly: monthlyAmount, since: monthlySince, until: "", scope: str(fd, "careScope", 500) } : null,
      personality: "",
      notes: text(fd, "notes"),
      communication: [],
      tasks: [],
    };
    const czk = (n: number) => `${n.toLocaleString("cs-CZ")} Kč`;
    const summary = [
      once && `Zakázka dokončena: ${projectName} – ${czk(amount)}${paid ? "" : " (čeká na zaplacení)"}`,
      monthly && `Měsíční paušál ${czk(monthlyAmount)} od ${monthlySince.split("-").reverse().join(". ")}`,
    ]
      .filter(Boolean)
      .join(". ");
    client.communication.push({ id: newId(), date: once ? finished : monthlySince, type: "note", authorId: meId, summary, nextStep: "" });
    db.clients.push(client);

    if (once) {
      const project: Project = {
        id: newId(),
        createdAt: now,
        updatedAt: now,
        name: projectName,
        clientId: client.id,
        type: oneOf(fd, "type", WEB_TYPES, "presentation"),
        status: "completed",
        package: str(fd, "package", 40),
        description: text(fd, "description"),
        stack: list(fd, "stack"),
        price: amount,
        probability: 1,
        startDate: date(fd, "startDate"),
        plannedEndDate: finished,
        actualEndDate: finished,
        estimatedHours: 0,
        actualHours: Math.max(0, num(fd, "hours")),
        externalCosts: 0,
        progress: 100,
        team: [],
        liveUrl: website,
        outcomeReasons: [],
        rating: rating || null,
        feedback: text(fd, "feedback"),
        holdReason: "",
      };
      db.projects.push(project);
      pushInvoice(db, {
        clientId: client.id,
        projectId: project.id,
        kind: "project",
        label: projectName,
        issueDate: finished,
        dueDate: addDays(finished, terms),
        amount,
        paid,
        paidDate: paid ? finished : "",
      });
    }

    if (monthly) {
      // Už zaplacené měsíce paušálu – aby byly vidět v obratu
      for (let i = 0; i < monthsPaid; i++) {
        const issueDate = addMonths(monthlySince, i);
        if (issueDate > today) break;
        pushInvoice(db, {
          clientId: client.id,
          projectId: "",
          kind: "retainer",
          label: `Paušál ${issueDate.slice(5, 7)}/${issueDate.slice(0, 4)}`,
          issueDate,
          dueDate: addDays(issueDate, terms),
          amount: monthlyAmount,
          paid: true,
          paidDate: issueDate,
        });
      }
    }
    return client.id;
  });
  done();
  redirect(`/clients/${clientId}`);
}
