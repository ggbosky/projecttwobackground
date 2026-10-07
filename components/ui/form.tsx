"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-fg-2">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, "h-9", className)} />;
}

export function TextArea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} {...props} className={cn(inputClass, "resize-y py-2 leading-relaxed", className)} />;
}

export function SelectInput({
  options,
  className,
  ...props
}: ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <select {...props} className={cn(inputClass, "h-9 cursor-pointer pr-8", className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-fg-2", className)}>
      <input type="checkbox" {...props} className="size-4 rounded border-line accent-[var(--accent)]" />
      {label}
    </label>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Ukládám…",
  className,
  variant = "primary",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-60",
        variant === "primary"
          ? "bg-accent text-accent-fg shadow-card hover:brightness-110"
          : "border border-line bg-surface text-fg hover:border-line-strong hover:bg-surface-2",
        className,
      )}
    >
      {pending && <LoaderCircle size={15} className="animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state?: { error?: string; message?: string } }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
        state.error
          ? "bg-red-500/10 text-red-700 dark:text-red-300"
          : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
      )}
    >
      {state.error ? <CircleAlert size={14} className="mt-px shrink-0" /> : <CircleCheck size={14} className="mt-px shrink-0" />}
      {state.error ?? state.message}
    </p>
  );
}

export function FormSection({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-20 grid grid-cols-1 gap-x-8 gap-y-4 border-b border-line py-6 last:border-b-0 lg:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
