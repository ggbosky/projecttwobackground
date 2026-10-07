/* ------------------------------------------------------------------ */
/* Uživatelé a přihlášení                                              */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  hoursPerWeek: number;
  hourlyCost: number;
  color: string;
  createdAt: string;
}

/** Uživatel bez citlivých polí – jen tohle smí do klientských komponent */
export type PublicUser = Omit<User, "passwordHash">;

export interface Session {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

/* ------------------------------------------------------------------ */
/* Klienti (CRM)                                                       */
/* ------------------------------------------------------------------ */

export type ClientStatus = "lead" | "active" | "former";
export type Priority = "A" | "B" | "C";
export type CompanySize = "" | "1" | "2-10" | "11-50" | "51-200" | "200+";
export type Timeline = "" | "asap" | "1-3m" | "3-6m" | "6m+";
export type CommunicationType = "email" | "call" | "meeting" | "note";

export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin: string;
  isDecisionMaker: boolean;
  note: string;
}

export interface Communication {
  id: string;
  date: string;
  type: CommunicationType;
  authorId: string;
  summary: string;
  nextStep: string;
}

export interface ClientTask {
  id: string;
  title: string;
  dueDate: string;
  assigneeId: string;
  done: boolean;
  createdAt: string;
  doneAt?: string;
}

export interface Retainer {
  monthly: number;
  since: string;
  until: string;
  scope: string;
}

export interface Qualification {
  budgetMin: number | null;
  budgetMax: number | null;
  needs: string;
  painPoints: string;
  decisionProcess: string;
  timeline: Timeline;
  /** Shoda s naším ideálním klientem 1–5, 0 = nehodnoceno */
  fit: number;
  competitors: string;
  whyUs: string;
}

export interface DigitalProfile {
  currentWebsite: string;
  platform: string;
  websiteAge: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  goals: string;
  kpis: string;
}

export interface Client {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  company: string;
  ico: string;
  dic: string;
  industry: string;
  size: CompanySize;
  annualRevenue: number | null;
  website: string;
  street: string;
  city: string;
  zip: string;
  country: string;

  status: ClientStatus;
  source: string;
  ownerId: string;
  priority: Priority;
  tags: string[];
  since: string;

  contacts: ContactPerson[];
  qualification: Qualification;
  digital: DigitalProfile;

  billingEmail: string;
  paymentTermsDays: number;
  retainer: Retainer | null;

  personality: string;
  notes: string;

  communication: Communication[];
  tasks: ClientTask[];
}

/* ------------------------------------------------------------------ */
/* Projekty                                                            */
/* ------------------------------------------------------------------ */

export type ProjectStatus = "proposal" | "in_progress" | "on_hold" | "completed" | "cancelled" | "lost";
export type WebType = "eshop" | "presentation" | "webflow" | "custom";

export interface Allocation {
  memberId: string;
  hoursPerWeek: number;
}

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  clientId: string;
  type: WebType;
  status: ProjectStatus;
  description: string;
  stack: string[];
  price: number;
  /** Pravděpodobnost výhry nabídky 0–1 */
  probability: number;
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string;
  estimatedHours: number;
  actualHours: number;
  externalCosts: number;
  progress: number;
  team: Allocation[];
  liveUrl: string;
  outcomeReasons: string[];
  rating: number | null;
  feedback: string;
  holdReason: string;
}

/* ------------------------------------------------------------------ */
/* Finance                                                             */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  projectId: string;
  kind: "project" | "retainer" | "other";
  label: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  /** Uložený stav – „overdue“ se dopočítává podle splatnosti */
  paid: boolean;
  paidDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface Settings {
  targetMonthlyRevenue: number;
  targetMargin: number;
  capacityBuffer: number;
}

export interface Database {
  version: 1;
  users: User[];
  sessions: Session[];
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  expenses: Expense[];
  settings: Settings;
}

/** Data pro výpočty a vykreslení (bez hesel a sessions) */
export interface DataContext {
  today: Date;
  users: PublicUser[];
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  expenses: Expense[];
  settings: Settings;
}

export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;
