"use client";

import { ArrowDown, ArrowUp, Building2, CornerDownLeft, FolderKanban, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { clientName, clients, projects, team } from "@/lib/data";
import { CLIENT_STATUS, PROJECT_STATUS } from "@/lib/status";
import { NAV } from "./nav";

interface Item {
  id: string;
  group: string;
  label: string;
  hint: string;
  href: string;
  icon: ReactNode;
  keywords: string;
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const ITEMS: Item[] = [
  ...NAV.map((n) => {
    const Icon = n.icon;
    return {
      id: `nav-${n.href}`,
      group: "Stránky",
      label: n.label,
      hint: n.description,
      href: n.href,
      icon: <Icon size={15} />,
      keywords: `${n.label} ${n.description}`,
    };
  }),
  ...clients.map((c) => ({
    id: c.id,
    group: "Klienti",
    label: c.company,
    hint: `${c.contactPerson} · ${CLIENT_STATUS[c.status].label}`,
    href: `/clients/${c.id}`,
    icon: <Building2 size={15} />,
    keywords: `${c.company} ${c.contactPerson} ${c.industry} ${c.email} ${c.city}`,
  })),
  ...projects.map((p) => ({
    id: p.id,
    group: "Projekty",
    label: p.name,
    hint: `${clientName(p.clientId)} · ${PROJECT_STATUS[p.status].label}`,
    href: `/projects/${p.id}`,
    icon: <FolderKanban size={15} />,
    keywords: `${p.name} ${clientName(p.clientId)} ${p.stack.join(" ")} ${p.repo ?? ""}`,
  })),
  ...team.map((m) => ({
    id: m.id,
    group: "Tým",
    label: m.name,
    hint: m.role,
    href: `/team#${m.id}`,
    icon: <User size={15} />,
    keywords: `${m.name} ${m.role} ${m.skills.join(" ")} ${m.github}`,
  })),
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    const list = q ? ITEMS.filter((i) => normalize(i.keywords).includes(q)) : ITEMS.filter((i) => i.group === "Stránky");
    return list.slice(0, 40);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const go = (item?: Item) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Vyhledávání">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in" onClick={onClose} />
      <div className="animate-in relative w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search size={16} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(results.length - 1, c + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[cursor]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Hledat klienta, projekt, člena týmu, technologii…"
            className="h-12 flex-1 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
            aria-label="Hledaný výraz"
          />
          <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">Nic nenalezeno pro „{query}“</p>}
          {results.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={`${item.group}-${item.id}`}>
                {header && <p className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-muted">{header}</p>}
                <button
                  data-index={index}
                  onMouseMove={() => setCursor(index)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    cursor === index ? "bg-surface-3 text-fg" : "text-fg-2",
                  )}
                >
                  <span className={cn("text-muted", cursor === index && "text-accent")}>{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-muted">{item.hint}</span>
                  </span>
                  {cursor === index && <CornerDownLeft size={14} className="text-muted" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <ArrowUp size={11} />
            <ArrowDown size={11} /> výběr
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft size={11} /> otevřít
          </span>
          <span className="ml-auto">{results.length} výsledků</span>
        </div>
      </div>
    </div>
  );
}
