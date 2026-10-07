"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/server/auth";
import { newId, updateDb } from "@/lib/server/db";
import { clamp, date, num, oneOf, str } from "@/lib/server/form";
import type { ActionState, Invoice } from "@/lib/types";

function done() {
  revalidatePath("/", "layout");
}

function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function saveInvoiceAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const clientId = str(fd, "clientId", 40);
  const amount = num(fd, "amount");
  if (!clientId) return { error: "Vyberte klienta." };
  if (amount <= 0) return { error: "Zadejte částku větší než 0." };
  const issueDate = date(fd, "issueDate") || new Date().toISOString().slice(0, 10);

  const result = await updateDb((db) => {
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) return "Klient nebyl nalezen.";
    const year = issueDate.slice(0, 4);
    const seq = db.invoices.filter((i) => i.number.startsWith(`FV-${year}-`)).length + 1;
    const paid = str(fd, "paid", 5) === "on";
    const invoice: Invoice = {
      id: newId(),
      number: str(fd, "number", 40) || `FV-${year}-${String(seq).padStart(4, "0")}`,
      clientId,
      projectId: str(fd, "projectId", 40),
      kind: oneOf(fd, "kind", ["project", "retainer", "other"] as const, "project"),
      label: str(fd, "label", 300),
      issueDate,
      dueDate: date(fd, "dueDate") || addDays(issueDate, client.paymentTermsDays || 14),
      amount,
      paid,
      paidDate: paid ? date(fd, "paidDate") || issueDate : "",
      createdAt: new Date().toISOString(),
    };
    db.invoices.push(invoice);
    return null;
  });
  if (result) return { error: result };
  done();
  return { ok: true, message: "Faktura uložena." };
}

export async function setInvoicePaidAction(id: string, paid: boolean): Promise<void> {
  await requireUser();
  await updateDb((db) => {
    const inv = db.invoices.find((i) => i.id === id);
    if (inv) {
      inv.paid = paid;
      inv.paidDate = paid ? new Date().toISOString().slice(0, 10) : "";
    }
  });
  done();
}

export async function deleteInvoiceAction(id: string): Promise<void> {
  await requireUser();
  await updateDb((db) => {
    db.invoices = db.invoices.filter((i) => i.id !== id);
  });
  done();
}

export async function saveExpenseAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const amount = num(fd, "amount");
  if (amount <= 0) return { error: "Zadejte částku větší než 0." };
  await updateDb((db) => {
    db.expenses.push({
      id: newId(),
      date: date(fd, "date") || new Date().toISOString().slice(0, 10),
      category: str(fd, "category", 80) || "Ostatní",
      description: str(fd, "description", 300),
      amount,
      createdAt: new Date().toISOString(),
    });
  });
  done();
  return { ok: true, message: "Náklad uložen." };
}

export async function deleteExpenseAction(id: string): Promise<void> {
  await requireUser();
  await updateDb((db) => {
    db.expenses = db.expenses.filter((e) => e.id !== id);
  });
  done();
}

export async function saveSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  await updateDb((db) => {
    db.settings = {
      targetMonthlyRevenue: Math.max(0, num(fd, "targetMonthlyRevenue")),
      targetMargin: clamp(num(fd, "targetMargin", 30), 0, 100) / 100,
      capacityBuffer: clamp(num(fd, "capacityBuffer", 15), 0, 60) / 100,
    };
  });
  done();
  return { ok: true, message: "Nastavení uloženo." };
}
