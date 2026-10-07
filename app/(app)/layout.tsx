import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { SearchItem } from "@/components/layout/CommandPalette";
import { isoDate } from "@/lib/format";
import { clientName, receivables } from "@/lib/metrics";
import { getData } from "@/lib/server/auth";
import { CLIENT_STATUS, PROJECT_STATUS } from "@/lib/status";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { me, ctx } = await getData();
  const r = receivables(ctx);
  const today = isoDate(ctx.today);

  const stats = {
    activeProjects: ctx.projects.filter((p) => p.status === "in_progress").length,
    leads: ctx.clients.filter((c) => c.status === "lead").length,
    clients: ctx.clients.length,
    overdueCount: r.overdueCount,
    overdueAmount: r.overdue,
    overdueTasks: ctx.clients.reduce((s, c) => s + c.tasks.filter((t) => !t.done && t.dueDate && t.dueDate < today).length, 0),
  };

  const searchItems: SearchItem[] = [
    ...ctx.clients.map((c) => ({
      id: c.id,
      group: "Klienti" as const,
      label: c.company,
      hint: `${c.contacts[0]?.name ?? "Bez kontaktu"} · ${CLIENT_STATUS[c.status].label}`,
      href: `/clients/${c.id}`,
      keywords: [c.company, c.ico, c.industry, c.city, c.website, ...c.tags, ...c.contacts.flatMap((p) => [p.name, p.email, p.phone])].join(" "),
    })),
    ...ctx.projects.map((p) => ({
      id: p.id,
      group: "Projekty" as const,
      label: p.name,
      hint: `${clientName(ctx, p.clientId)} · ${PROJECT_STATUS[p.status].label}`,
      href: `/projects/${p.id}`,
      keywords: `${p.name} ${clientName(ctx, p.clientId)} ${p.stack.join(" ")}`,
    })),
    ...ctx.users.map((u) => ({
      id: u.id,
      group: "Tým" as const,
      label: u.name,
      hint: u.role,
      href: `/team#${u.id}`,
      keywords: `${u.name} ${u.email} ${u.role}`,
    })),
  ];

  return (
    <AppShell stats={stats} user={me} searchItems={searchItems}>
      {children}
    </AppShell>
  );
}
