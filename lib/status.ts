import type { ClientStatus, DeployState, InvoiceStatus, ProjectStatus, WebType } from "./types";

export type Tone = "green" | "blue" | "amber" | "red" | "violet" | "gray" | "rose";

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const PROJECT_STATUS: Record<ProjectStatus, StatusMeta & { short: string }> = {
  proposal: { label: "Nabídka", short: "Lead", tone: "violet" },
  in_progress: { label: "Probíhá", short: "In Progress", tone: "blue" },
  on_hold: { label: "Pozastaveno", short: "On Hold", tone: "amber" },
  completed: { label: "Úspěšně dokončeno", short: "Successful", tone: "green" },
  cancelled: { label: "Zrušeno", short: "Failed", tone: "red" },
  lost: { label: "Prohráno", short: "Lost", tone: "gray" },
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "in_progress",
  "proposal",
  "on_hold",
  "completed",
  "cancelled",
  "lost",
];

export const CLIENT_STATUS: Record<ClientStatus, StatusMeta> = {
  active: { label: "Aktivní klient", tone: "green" },
  lead: { label: "Potenciální (Lead)", tone: "violet" },
  former: { label: "Bývalý klient", tone: "gray" },
};

export const INVOICE_STATUS: Record<InvoiceStatus, StatusMeta> = {
  paid: { label: "Uhrazeno", tone: "green" },
  pending: { label: "Čeká na úhradu", tone: "blue" },
  overdue: { label: "Po splatnosti", tone: "red" },
};

export const DEPLOY_STATE: Record<DeployState, StatusMeta> = {
  ready: { label: "Ready", tone: "green" },
  building: { label: "Building", tone: "amber" },
  error: { label: "Error", tone: "red" },
  queued: { label: "Queued", tone: "gray" },
  none: { label: "Bez nasazení", tone: "gray" },
};

export const WEB_TYPE: Record<WebType, { label: string; color: string }> = {
  eshop: { label: "E-shop", color: "var(--series-1)" },
  presentation: { label: "Prezentační web", color: "var(--series-2)" },
  webflow: { label: "Webflow", color: "var(--series-3)" },
  custom: { label: "Custom aplikace", color: "var(--series-4)" },
};

export const WEB_TYPE_ORDER: WebType[] = ["eshop", "presentation", "webflow", "custom"];
