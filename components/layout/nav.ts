import { FolderKanban, Gauge, LayoutDashboard, Trophy, Users, Wallet, type LucideIcon } from "lucide-react";
import { GithubIcon } from "@/components/ui/GithubIcon";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | typeof GithubIcon;
  description: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Přehled", icon: LayoutDashboard, description: "Klíčová čísla agentury na jednom místě" },
  { href: "/finance", label: "Finance & KPI", icon: Wallet, description: "Obrat, MRR/ARR, cashflow a profitabilita" },
  { href: "/clients", label: "Klienti", icon: Users, description: "CRM – kontakty, vztahy, historie komunikace" },
  { href: "/projects", label: "Projekty", icon: FolderKanban, description: "Všechny zakázky s filtrováním" },
  { href: "/success", label: "Úspěšnost", icon: Trophy, description: "Win/Loss, případové studie a hodnocení" },
  { href: "/github", label: "GitHub", icon: GithubIcon, description: "Repozitáře, PR, issues a nasazení" },
  { href: "/team", label: "Tým & kapacita", icon: Gauge, description: "Project Two Operations – vytížení a plánování" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
