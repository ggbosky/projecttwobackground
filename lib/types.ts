export type ClientStatus = "active" | "former" | "lead";

export type ProjectStatus =
  | "proposal"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "lost";

export type WebType = "eshop" | "presentation" | "webflow" | "custom";

export type CommunicationType = "email" | "call" | "meeting" | "note";

export interface Communication {
  date: string;
  type: CommunicationType;
  author: string; // team member id
  summary: string;
}

export interface Retainer {
  monthly: number;
  since: string;
  until?: string;
  scope: string;
}

export interface Client {
  id: string;
  company: string;
  contactPerson: string;
  contactRole: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  city: string;
  status: ClientStatus;
  since: string;
  source: string;
  owner: string; // team member id
  retainer?: Retainer;
  personality: string;
  notes: string;
  tags: string[];
  communication: Communication[];
}

export interface Allocation {
  memberId: string;
  hoursPerWeek: number;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  type: WebType;
  status: ProjectStatus;
  description: string;
  stack: string[];
  price: number;
  /** Pravděpodobnost výhry (jen pro nabídky), 0–1 */
  probability?: number;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  estimatedHours: number;
  actualHours: number;
  externalCosts: number;
  progress: number;
  team: Allocation[];
  repo?: string;
  liveUrl?: string;
  outcomeReasons: string[];
  rating?: number;
  feedback?: string;
  holdReason?: string;
}

export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  projectId?: string;
  kind: "project" | "retainer";
  label: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
}

export interface MonthlyExpense {
  month: string; // YYYY-MM
  salaries: number;
  tools: number;
  marketing: number;
  office: number;
}

export interface FinanceData {
  currency: string;
  referenceDate: string;
  invoices: Invoice[];
  expenses: MonthlyExpense[];
  targets: { monthlyRevenue: number; margin: number };
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  github: string;
  hoursPerWeek: number;
  hourlyCost: number;
  skills: string[];
  joined: string;
  color: string;
  bio: string;
}

export type DeployState = "ready" | "building" | "error" | "queued" | "none";

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface PullRequest {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  draft: boolean;
  url?: string;
}

export interface Issue {
  number: number;
  title: string;
  labels: string[];
  createdAt: string;
  url?: string;
}

export interface Deployment {
  provider: "Vercel" | "Netlify" | "Webflow" | "Jiný";
  state: DeployState;
  environment: string;
  url?: string;
  updatedAt?: string;
}

export interface Repo {
  fullName: string;
  projectId: string;
  description: string;
  private: boolean;
  language: string;
  defaultBranch: string;
  pushedAt: string;
  url: string;
  deployment: Deployment;
  commits: Commit[];
  pullRequests: PullRequest[];
  issues: Issue[];
  /** Pouze živá data – chyba při načtení konkrétního repozitáře */
  error?: string;
}

export interface GithubPayload {
  mode: "live" | "demo";
  org: string;
  fetchedAt: string;
  repos: Repo[];
  message?: string;
}
