import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  CLIENT_STATUS,
  DEPLOY_STATE,
  INVOICE_STATUS,
  PROJECT_STATUS,
  type Tone,
} from "@/lib/status";
import type { ClientStatus, DeployState, InvoiceStatus, ProjectStatus } from "@/lib/types";

const TONE: Record<Tone, { badge: string; dot: string }> = {
  green: {
    badge: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-400 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
  },
  blue: {
    badge: "bg-blue-500/10 text-blue-700 ring-blue-600/20 dark:text-blue-400 dark:ring-blue-400/20",
    dot: "bg-blue-500",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-800 ring-amber-600/25 dark:text-amber-400 dark:ring-amber-400/20",
    dot: "bg-amber-500",
  },
  red: {
    badge: "bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-400 dark:ring-red-400/20",
    dot: "bg-red-500",
  },
  violet: {
    badge: "bg-violet-500/10 text-violet-700 ring-violet-600/20 dark:text-violet-300 dark:ring-violet-400/25",
    dot: "bg-violet-500",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-700 ring-rose-600/20 dark:text-rose-400 dark:ring-rose-400/20",
    dot: "bg-rose-500",
  },
  gray: {
    badge: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400 dark:ring-zinc-400/20",
    dot: "bg-zinc-400",
  },
};

export function Badge({
  tone = "gray",
  children,
  dot = true,
  pulse = false,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        TONE[tone].badge,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", TONE[tone].dot, pulse && "pulse-dot")} aria-hidden />}
      {children}
    </span>
  );
}

export function ProjectStatusBadge({ status, short = false }: { status: ProjectStatus; short?: boolean }) {
  const meta = PROJECT_STATUS[status];
  return (
    <Badge tone={meta.tone} pulse={status === "in_progress"}>
      {short ? meta.short : meta.label}
    </Badge>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const meta = CLIENT_STATUS[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const meta = INVOICE_STATUS[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function DeployBadge({ state, provider }: { state: DeployState; provider?: string }) {
  const meta = DEPLOY_STATE[state];
  return (
    <Badge tone={meta.tone} pulse={state === "building"}>
      {provider && state !== "none" ? `${provider} · ${meta.label}` : meta.label}
    </Badge>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-fg-2">
      {children}
    </span>
  );
}
