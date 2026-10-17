"use client";

import { Bell, Building2, Command, Menu, Moon, Plus, Search, Sun, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { setMeAction } from "@/app/actions/team";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { formatCZKCompact } from "@/lib/format";
import type { PublicUser } from "@/lib/types";
import { CommandPalette, type SearchItem } from "./CommandPalette";
import { NAV, SETTINGS_NAV, isActive } from "./nav";
import { useTheme, type ThemeChoice } from "./ThemeProvider";

export interface ShellStats {
  activeProjects: number;
  leads: number;
  clients: number;
  overdueCount: number;
  overdueAmount: number;
  overdueTasks: number;
}

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-lg px-1 py-1">
      <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-[11px] font-bold text-white shadow-sm transition-transform group-hover:scale-105">
        P2
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight text-fg">Project Two</span>
        <span className="block text-[11px] text-muted">CRM & řídicí centrum</span>
      </span>
    </Link>
  );
}

function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const options: { value: ThemeChoice; label: string }[] = [
    { value: "light", label: "Světlý" },
    { value: "dark", label: "Tmavý" },
    { value: "system", label: "Auto" },
  ];
  return (
    <div role="radiogroup" aria-label="Motiv" className="grid grid-cols-3 rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={theme === o.value}
          onClick={() => setTheme(o.value)}
          className={cn(
            "rounded-md py-1 text-[11px] font-medium transition-all",
            theme === o.value ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SidebarContent({
  stats,
  user,
  members,
  onNavigate,
}: {
  stats: ShellStats;
  user: PublicUser | null;
  members: PublicUser[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const counts: Record<string, number | undefined> = {
    "/projects": stats.activeProjects,
    "/clients": stats.clients,
  };
  const SettingsIcon = SETTINGS_NAV.icon;
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-4 pb-2">
        <Logo />
      </div>
      <div className="px-3 pt-2">
        <Link
          href="/clients/new"
          onClick={onNavigate}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-accent text-xs font-medium text-accent-fg shadow-card transition-all hover:brightness-110"
        >
          <Plus size={14} /> Přidat klienta
        </Link>
      </div>
      <nav className="mt-4 flex-1 space-y-0.5 px-2" aria-label="Hlavní navigace">
        <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-muted uppercase">Workspace</p>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const count = counts[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                active ? "bg-surface-3 font-medium text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
              )}
            >
              {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-accent" aria-hidden />}
              <Icon size={16} className={cn("shrink-0", active ? "text-accent" : "text-muted group-hover:text-fg-2")} />
              <span className="truncate">{item.label}</span>
              {typeof count === "number" && count > 0 && (
                <span className="tabular ml-auto rounded-md bg-surface-2 px-1.5 text-[10px] font-medium text-muted ring-1 ring-line">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-line p-3">
        {stats.overdueCount > 0 && (
          <Link
            href="/finance#faktury"
            onClick={onNavigate}
            className="block rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-xs transition-colors hover:bg-red-500/10"
          >
            <span className="font-medium text-red-700 dark:text-red-400">{stats.overdueCount}× faktura po splatnosti</span>
            <span className="block text-muted">{formatCZKCompact(stats.overdueAmount)} k vymáhání</span>
          </Link>
        )}
        <ThemeSwitch />
        <MemberSwitch user={user} members={members} onNavigate={onNavigate} />
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-fg"
        >
          <SettingsIcon size={14} /> {SETTINGS_NAV.label}
        </Link>
      </div>
    </div>
  );
}

function MemberSwitch({ user, members, onNavigate }: { user: PublicUser | null; members: PublicUser[]; onNavigate?: () => void }) {
  const [pending, start] = useTransition();
  if (!members.length) {
    return (
      <Link
        href="/team"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-lg border border-dashed border-line-strong px-2.5 py-2 text-xs text-fg-2 hover:border-accent hover:text-accent"
      >
        <UserPlus size={14} /> Přidejte členy týmu
      </Link>
    );
  }
  return (
    <label className={cn("flex items-center gap-2.5 rounded-lg px-1 py-1", pending && "opacity-60")}>
      {user ? <Avatar name={user.name} color={user.color} size="sm" /> : <Building2 size={16} className="text-muted" />}
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[10px] text-muted">Pracuji jako</span>
        <select
          value={user?.id ?? ""}
          onChange={(e) => start(() => setMeAction(e.target.value))}
          className="-ml-0.5 w-full cursor-pointer truncate bg-transparent text-xs font-medium text-fg focus:outline-none"
          aria-label="Pracuji jako"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

export function AppShell({
  children,
  stats,
  user,
  members,
  searchItems,
}: {
  children: ReactNode;
  stats: ShellStats;
  user: PublicUser | null;
  members: PublicUser[];
  searchItems: SearchItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { resolved, toggle } = useTheme();
  const pathname = usePathname();
  const alerts = stats.overdueCount + stats.overdueTasks;

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-bg lg:block">
        <SidebarContent stats={stats} user={user} members={members} />
      </aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!mobileOpen}>
        <div
          className={cn("absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-bg shadow-2xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-3 rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Zavřít menu"
          >
            <X size={18} />
          </button>
          <SidebarContent stats={stats} user={user} members={members} onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-4 sm:px-6">
            <button onClick={() => setMobileOpen(true)} className="-ml-1.5 rounded-md p-1.5 text-fg-2 hover:bg-surface-2 lg:hidden" aria-label="Otevřít menu">
              <Menu size={20} />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>
            <button
              onClick={() => setPaletteOpen(true)}
              className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg-2 sm:w-72 lg:ml-0"
              aria-label="Hledat (Ctrl+K)"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Hledat klienty, projekty…</span>
              <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
                <Command size={10} />K
              </kbd>
            </button>
            <div className="flex items-center gap-1 lg:ml-auto">
              <button
                onClick={toggle}
                className="rounded-lg p-2 text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label={resolved === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
              >
                {resolved === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <Link
                href="/"
                className="relative rounded-lg p-2 text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label={`Upozornění: ${alerts}`}
              >
                <Bell size={17} />
                {alerts > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-bg" />}
              </Link>
              {user && (
                <Link href="/team" className="ml-1 hidden sm:block" aria-label={`Pracuji jako ${user.name}`} title={`Pracuji jako ${user.name}`}>
                  <Avatar name={user.name} color={user.color} size="sm" />
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={searchItems} />
    </div>
  );
}
