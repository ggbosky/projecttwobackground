import type { InvoiceRow } from "@/components/finance/InvoicesTable";
import { clientName, invoiceStatus } from "./metrics";
import type { DataContext, Invoice } from "./types";

export function invoiceRows(ctx: DataContext, invoices: Invoice[] = ctx.invoices): InvoiceRow[] {
  return invoices.map((i) => ({
    id: i.id,
    number: i.number,
    clientId: i.clientId,
    clientName: clientName(ctx, i.clientId),
    projectId: i.projectId,
    projectName: ctx.projects.find((p) => p.id === i.projectId)?.name ?? "",
    kind: i.kind,
    label: i.label,
    issueDate: i.issueDate,
    dueDate: i.dueDate,
    paidDate: i.paidDate,
    amount: i.amount,
    status: invoiceStatus(i, ctx.today),
  }));
}
