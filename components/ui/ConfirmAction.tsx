"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Dvoukrokové potvrzení destruktivní akce (bez nativního confirm dialogu) */
export function ConfirmAction({
  action,
  children,
  confirmLabel = "Opravdu smazat?",
  className,
  variant = "danger",
}: {
  action: () => Promise<void>;
  children: ReactNode;
  confirmLabel?: string;
  className?: string;
  variant?: "danger" | "ghost";
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => (armed ? start(() => action()) : setArmed(true))}
        onBlur={() => setTimeout(() => setArmed(false), 150)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors disabled:opacity-60",
          armed
            ? "bg-red-600 text-white hover:bg-red-700"
            : variant === "danger"
              ? "text-red-600 hover:bg-red-500/10 dark:text-red-400"
              : "text-muted hover:bg-surface-2 hover:text-fg",
          className,
        )}
      >
        {pending && <LoaderCircle size={13} className="animate-spin" />}
        {armed ? confirmLabel : children}
      </button>
    </span>
  );
}
