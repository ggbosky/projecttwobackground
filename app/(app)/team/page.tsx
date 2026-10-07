import { Clock, Mail, UserMinus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { removeMemberAction } from "@/app/actions/team";
import { CapacityPlanner, type PlannerMonth } from "@/components/team/CapacityPlanner";
import { AddMemberForm } from "@/components/team/MemberForms";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { PageHeader } from "@/components/ui/PageHeader";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/cn";
import { formatHours, formatMonthShort, formatNumber, formatPercent } from "@/lib/format";
import { addMonths, avgMonthlyHoursByType, capacityForMonth, currentMonth, memberLoad, runningProjects } from "@/lib/metrics";
import { getData } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Tým & kapacita" };

export default async function TeamPage() {
  const { me, ctx } = await getData();
  const month = currentMonth(ctx);
  const months: PlannerMonth[] = [0, 1, 2, 3].map((i) => {
    const c = capacityForMonth(ctx, addMonths(month, i));
    return {
      month: c.month,
      label: i === 0 ? `${formatMonthShort(c.month)} (zbytek)` : formatMonthShort(c.month),
      allocated: Math.round(c.allocated),
      free: Math.round(c.free),
      buffer: Math.round(c.buffer),
      capacity: Math.round(c.capacity),
      pipeline: Math.round(c.pipelineDemand),
      slots: c.slots,
      utilization: c.utilization,
    };
  });
  const running = runningProjects(ctx);
  const totalWeekly = ctx.users.reduce((s, u) => s + u.hoursPerWeek, 0);
  const allocatedWeekly = ctx.users.reduce((s, u) => s + memberLoad(ctx, u).allocated, 0);

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Project Two Operations"
        title="Tým & kapacita"
        description="Kdo z nás na čem dělá, jak jsme vytížení a kolik nových webů zvládneme nabrat."
        actions={<AddMemberForm />}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ctx.users.map((m) => {
          const load = memberLoad(ctx, m);
          return (
            <Card key={m.id} id={m.id} as="article" className="scroll-mt-20 p-5 target:ring-2 target:ring-accent/50">
              <div className="flex items-start gap-4">
                <Avatar name={m.name} color={m.color} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-fg">
                    {m.name}
                    {m.id === me.id && <span className="ml-2 rounded bg-accent-soft px-1.5 text-[10px] font-medium text-accent">to jsi ty</span>}
                  </p>
                  <p className="text-xs text-muted">{m.role || "Bez role"}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
                    <Mail size={11} /> {m.email}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                  <p className="text-muted">Kapacita</p>
                  <p className="tabular font-medium text-fg">{m.hoursPerWeek} h / týden</p>
                </div>
                <div className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                  <p className="text-muted">Nákladová sazba</p>
                  <p className={cn("tabular font-medium", m.hourlyCost ? "text-fg" : "text-amber-700 dark:text-amber-400")}>
                    {m.hourlyCost ? `${formatNumber(m.hourlyCost)} Kč/h` : "nenastaveno"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-muted">Vytížení</span>
                  <span className="tabular font-medium text-fg">
                    {load.allocated} / {m.hoursPerWeek} h · {formatPercent(load.utilization)}
                  </span>
                </div>
                <Progress value={load.allocated} max={m.hoursPerWeek || 1} tone="auto" label={`Vytížení ${m.name}`} />
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                {load.assignments.length === 0 && <li className="text-xs text-muted">Žádné běžící projekty</li>}
                {load.assignments.map((a) => (
                  <li key={a.project.id} className="flex items-center justify-between gap-2 text-xs">
                    <Link href={`/projects/${a.project.id}`} className="truncate text-fg-2 hover:text-accent">
                      {a.project.name}
                    </Link>
                    <span className="tabular shrink-0 text-muted">{a.hours} h/týd.</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3">
                {m.id === me.id ? (
                  <Link href="/settings" className="text-xs font-medium text-accent hover:underline">
                    Upravit můj profil
                  </Link>
                ) : (
                  <ConfirmAction action={removeMemberAction.bind(null, m.id)} confirmLabel="Opravdu odebrat účet?" variant="ghost">
                    <UserMinus size={13} /> Odebrat
                  </ConfirmAction>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Kapacitní plánovač"
          description={`Kapacita týmu ${formatHours(totalWeekly)} týdně · teď alokováno ${formatHours(allocatedWeekly)} · rezerva ${formatPercent(ctx.settings.capacityBuffer)} na podporu a obchod`}
          icon={<Clock size={15} />}
        />
        <CardBody>
          <CapacityPlanner months={months} perTypeMonthlyHours={avgMonthlyHoursByType(ctx)} />
          {!ctx.projects.some((p) => p.status === "completed") && (
            <p className="mt-4 text-[11px] text-muted">
              Dokud nemáte dokončené projekty, počítá se s průměrnou náročností 80 h na web za měsíc. Po prvních dokončených zakázkách se odhad zpřesní z vašich dat.
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Vytížení na projektech" description="Hodiny týdně na běžících projektech" icon={<Users size={15} />} />
        {running.length === 0 ? (
          <p className="px-5 pb-5 text-xs text-muted">Žádné běžící projekty. Tým přiřadíte v detailu projektu (hodiny týdně na osobu).</p>
        ) : (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-muted">
                  <th className="px-5 py-2.5 font-medium">Člen týmu</th>
                  {running.map((p) => (
                    <th key={p.id} className="px-2 py-2.5 text-center font-medium">
                      <Link href={`/projects/${p.id}`} className="block max-w-[120px] truncate hover:text-fg" title={p.name}>
                        {p.name}
                      </Link>
                    </th>
                  ))}
                  <th className="px-5 py-2.5 text-right font-medium">Celkem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ctx.users.map((m) => {
                  const load = memberLoad(ctx, m);
                  return (
                    <tr key={m.id}>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} color={m.color} size="sm" />
                          <span className="truncate text-sm text-fg">{m.name}</span>
                        </div>
                      </td>
                      {running.map((p) => {
                        const h = p.team.find((a) => a.memberId === m.id)?.hoursPerWeek ?? 0;
                        return (
                          <td key={p.id} className="px-2 py-2.5 text-center">
                            {h > 0 ? (
                              <span
                                className="tabular inline-flex min-w-9 justify-center rounded-md px-1.5 py-1 text-xs font-medium text-fg"
                                style={{ background: `color-mix(in oklab, var(--series-1) ${Math.min(85, 12 + h * 3)}%, transparent)` }}
                              >
                                {h}
                              </span>
                            ) : (
                              <span className="text-xs text-line-strong">·</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-2.5 text-right">
                        <span
                          className={cn(
                            "tabular text-xs font-semibold",
                            load.utilization > 1 ? "text-red-600 dark:text-red-400" : load.utilization > 0.9 ? "text-amber-700 dark:text-amber-400" : "text-fg",
                          )}
                        >
                          {load.allocated} / {m.hoursPerWeek} h
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
