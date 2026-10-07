import { FolderKanban, Gauge, LayoutDashboard, Settings, Trophy, Users, Wallet, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Přehled", icon: LayoutDashboard, description: "Klíčová čísla agentury na jednom místě" },
  { href: "/clients", label: "Klienti (CRM)", icon: Users, description: "Databáze klientů, analýzy, komunikace a úkoly" },
  { href: "/projects", label: "Projekty", icon: FolderKanban, description: "Zakázky od nabídky po předání" },
  { href: "/finance", label: "Finance", icon: Wallet, description: "Faktury, náklady, MRR/ARR a profitabilita" },
  { href: "/success", label: "Úspěšnost", icon: Trophy, description: "Win/Loss, případové studie a hodnocení" },
  { href: "/team", label: "Tým & kapacita", icon: Gauge, description: "Vytížení týmu a kapacitní plánovač" },
];

export const SETTINGS_NAV: NavItem = { href: "/settings", label: "Nastavení", icon: Settings, description: "Profil, heslo a cíle agentury" };

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
