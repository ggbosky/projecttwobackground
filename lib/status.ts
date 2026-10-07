import type { ClientStatus, CommunicationType, CompanySize, InvoiceStatus, Priority, ProjectStatus, Timeline, WebType } from "./types";

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

export const WEB_TYPE: Record<WebType, { label: string; color: string }> = {
  eshop: { label: "E-shop", color: "var(--series-1)" },
  presentation: { label: "Prezentační web", color: "var(--series-2)" },
  webflow: { label: "Webflow", color: "var(--series-3)" },
  custom: { label: "Custom aplikace", color: "var(--series-4)" },
};

export const WEB_TYPE_ORDER: WebType[] = ["eshop", "presentation", "webflow", "custom"];

export const PRIORITY: Record<Priority, StatusMeta> = {
  A: { label: "A – klíčový", tone: "red" },
  B: { label: "B – standard", tone: "blue" },
  C: { label: "C – nízká", tone: "gray" },
};

export const COMPANY_SIZE: Record<CompanySize, string> = {
  "": "Neuvedeno",
  "1": "OSVČ / 1 osoba",
  "2-10": "2–10 lidí",
  "11-50": "11–50 lidí",
  "51-200": "51–200 lidí",
  "200+": "200+ lidí",
};

export const TIMELINE: Record<Timeline, string> = {
  "": "Neznámý",
  asap: "Ihned",
  "1-3m": "Do 3 měsíců",
  "3-6m": "3–6 měsíců",
  "6m+": "Déle než 6 měsíců",
};

export const COMM_TYPE: Record<CommunicationType, string> = {
  email: "E-mail",
  call: "Telefonát",
  meeting: "Schůzka",
  note: "Poznámka",
};

export const CLIENT_SOURCES = [
  "Doporučení",
  "Web / poptávkový formulář",
  "LinkedIn",
  "Instagram / Facebook",
  "Google",
  "Event / networking",
  "Cold outreach",
  "Jiný",
];

export const EXPENSE_CATEGORIES = ["Mzdy a odměny", "Software a nástroje", "Marketing", "Kancelář", "Freelanceři", "Hardware", "Daně a poplatky", "Ostatní"];

export const OUTCOME_REASONS_POSITIVE = [
  "Dodáno nad očekávání",
  "Dodrženo v termínu",
  "Pod rozpočtem hodin",
  "Jasné zadání",
  "Rychlá zpětná vazba klienta",
  "Dobrá spolupráce",
];

export const OUTCOME_REASONS_NEGATIVE = [
  "Špatný budget klienta",
  "Konkurence s nižší cenou",
  "Nejasné zadání",
  "Klient změnil strategii",
  "Pomalá komunikace klienta",
  "Nereálný termín",
  "Rozšíření scope bez navýšení ceny",
];

export const MEMBER_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6", "#22c55e"];
