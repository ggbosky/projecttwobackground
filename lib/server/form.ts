import "server-only";

/** Pomocné funkce pro bezpečné čtení hodnot z FormData */

export function str(fd: FormData, key: string, max = 500): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function text(fd: FormData, key: string): string {
  return str(fd, key, 10_000);
}

export function num(fd: FormData, key: string, fallback = 0): number {
  const raw = str(fd, key, 40).replace(/\s/g, "").replace(",", ".");
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function numOrNull(fd: FormData, key: string): number | null {
  const raw = str(fd, key, 40).replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function date(fd: FormData, key: string): string {
  const v = str(fd, key, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

export function oneOf<T extends string>(fd: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const v = str(fd, key, 50) as T;
  return allowed.includes(v) ? v : fallback;
}

export function list(fd: FormData, key: string): string[] {
  return str(fd, key, 2000)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function json<T>(fd: FormData, key: string, fallback: T): T {
  try {
    return JSON.parse(str(fd, key, 100_000)) as T;
  } catch {
    return fallback;
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
