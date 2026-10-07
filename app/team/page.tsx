import { Award, Clock, Heart, Mail, Rocket, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CapacityPlanner, type PlannerMonth } from "@/components/team/CapacityPlanner";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Progress } from "@/components/ui/Progress";
import { REFERENCE_MONTH, clients, projects, team } from "@/lib/data";
import { formatHours, formatMonthShort, formatNumber, formatPercent } from "@/lib/format";
import {
  CAPACITY_BUFFER,
  addMonths,
  avgMonthlyHoursByType,
  capacityForMonth,
  memberLoad,
  runningProjects,
  successMetrics,
} from "@/lib/metrics";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Tým & kapacita" };

export default function TeamPage() {
  const months: PlannerMonth[] = [0, 1, 2, 3].map((i) => {
    const c = capacityForMonth(addMonths(REFERENCE_MONTH, i));
    const buffer = c.capacity * CAPACITY_BUFFER;
    return {
      month: c.month,
      label: i === 0 ? `${formatMonthShort(c.month)} (zbytek)` : formatMonthShort(c.month),
      allocated: Math.round(c.allocated),
      free: Math.round(c.free),
      buffer: Math.round(Math.min(buffer, Math.max(0, c.capacity - c.allocated))),
      capacity: Math.round(c.capacity),
      pipeline: Math.round(c.pipelineDemand),
      slots: c.slots,
      utilization: c.utilization,
    };
  });

  const running = runningProjects();
  const totalWeekly = team.reduce((s, m) => s + m.hoursPerWeek, 0);
  const allocatedWeekly = team.reduce((s, m) => s + memberLoad(m).allocated, 0);
  const success = successMetrics();
  const delivered = projects.filter((p) => p.status === "completed").length;

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Project Two Operations"
        title="O nás & tým"
        description="Kdo jsme, kdo na čem pracuje a kolik nových webů dokážeme v nejbližších měsících nabrat."
      />

      {/* O nás */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-fuchsia-500/10 blur-3xl" />
        <div className="relative grid grid-cols-1 gap-6 p-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-fg-2">
              <Sparkles size={12} className="text-accent" /> Webová agentura · Praha & Brno · od 2021
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
              Navrhujeme a stavíme weby, které pro klienty vydělávají.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-2">
              Project Two je malé, seniorní studio. Spojujeme design, vývoj na míru (Next.js, headless e-commerce) a Webflow tam, kde si
              klient chce obsah spravovat sám. Každý projekt vede jeden člověk od discovery po spuštění a po předání se o web dál staráme
              v rámci retaineru.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Value icon={<Heart size={13} />} text="Partnerství místo dodávky" />
              <Value icon={<Rocket size={13} />} text="Výkon a měřitelné výsledky" />
              <Value icon={<Award size={13} />} text="Řemeslná kvalita" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            <Fact label="Členů týmu" value={String(team.length)} />
            <Fact label="Dokončených webů" value={String(delivered)} />
            <Fact label="Aktivních klientů" value={String(clients.filter((c) => c.status === "active").length)} />
            <Fact label="Hodnocení klientů" value={`${formatNumber(success.avgRating, 1)} ★`} />
            <Fact label="Kapacita týdně" value={formatHours(totalWeekly)} />
            <Fact label="Vytížení teď" value={formatPercent(allocatedWeekly / totalWeekly)} />
          </div>
        </div>
      </Card>

      {/* Kapacitní plánovač */}
      <Card className="mt-4">
        <CardHeader
          title="Kapacitní plánovač"
          description={`Kolik nových průměrných webů zvládneme nabrat · rezerva ${formatPercent(CAPACITY_BUFFER)} na podporu, obchod a nepředvídané úkoly`}
          icon={<Clock size={15} />}
        />
        <CardBody>
          <CapacityPlanner months={months} perTypeMonthlyHours={avgMonthlyHoursByType()} />
        </CardBody>
      </Card>

      {/* Matice alokací */}
      <Card className="mt-4">
        <CardHeader title="Vytížení na projektech" description="Hodiny týdně na běžících projektech" icon={<Users size={15} />} />
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/50 text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Člen týmu</th>
                {running.map((p) => (
                  <th key={p.id} className="px-2 py-2.5 text-center font-medium">
                    <Link href={`/projects/${p.id}`} className="block max-w-[110px] truncate hover:text-fg" title={p.name}>
                      {p.name}
                    </Link>
                  </th>
                ))}
                <th className="px-5 py-2.5 text-right font-medium">Celkem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {team.map((m) => {
                const load = memberLoad(m);
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
                              title={`${m.name}: ${h} h/týden na ${p.name}`}
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
      </Card>

      {/* Členové týmu */}
      <h2 className="mt-8 mb-4 text-base font-semibold tracking-tight text-fg">Členové týmu</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {team.map((m) => {
          const load = memberLoad(m);
          return (
            <Card key={m.id} id={m.id} as="article" className="scroll-mt-20 p-5 target:ring-2 target:ring-accent/50">
              <div className="flex items-start gap-4">
                <Avatar name={m.name} color={m.color} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-fg">{m.name}</p>
                  <p className="text-xs text-muted">{m.role}</p>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted">
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-accent">
                      <Mail size={11} /> {m.email}
                    </a>
                    <a href={`https://github.com/${m.github}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">
                      <GithubIcon size={11} /> {m.github}
                    </a>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-fg-2">{m.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {m.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-muted">Vytížení</span>
                  <span className="tabular font-medium text-fg">
                    {load.allocated} / {m.hoursPerWeek} h · {formatPercent(load.utilization)}
                  </span>
                </div>
                <Progress value={load.allocated} max={m.hoursPerWeek} tone="auto" label={`Vytížení ${m.name}`} />
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                {load.assignments.length === 0 && <li className="text-xs text-muted">Bez přiřazených projektů</li>}
                {load.assignments.map((a) => (
                  <li key={a.project.id} className="flex items-center justify-between gap-2 text-xs">
                    <Link href={`/projects/${a.project.id}`} className="truncate text-fg-2 hover:text-accent">
                      {a.project.name}
                    </Link>
                    <span className="tabular shrink-0 text-muted">{a.hours} h/týd.</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface/60 px-3 py-2.5 backdrop-blur">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-lg font-semibold tracking-tight text-fg">{value}</p>
    </div>
  );
}

function Value({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-fg-2">
      <span className="text-accent">{icon}</span>
      {text}
    </span>
  );
}
