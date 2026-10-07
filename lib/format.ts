import { REFERENCE_DATE } from "./data";

const czk = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });

/** 1 250 000 Kč */
export function formatCZK(value: number): string {
  return czk.format(Math.round(value));
}

/** 1,25 mil. Kč / 480 tis. Kč – pro KPI karty a osy grafů */
export function formatCZKCompact(value: number, withUnit = true): string {
  const abs = Math.abs(value);
  const unit = withUnit ? " Kč" : "";
  if (abs >= 1_000_000) return `${num1.format(value / 1_000_000)} mil.${unit}`;
  if (abs >= 1_000) return `${num.format(value / 1_000)} tis.${unit}`;
  return `${num.format(value)}${unit}`;
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${formatNumber(value * 100, digits)} %`;
}

export function formatHours(value: number): string {
  return `${formatNumber(value)} h`;
}

const dateFmt = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" });
const dateShortFmt = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("cs-CZ", { month: "short", timeZone: "UTC" });
const monthLongFmt = new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric", timeZone: "UTC" });

export function parseDate(value: string): Date {
  return value.length === 10 ? new Date(`${value}T00:00:00Z`) : new Date(value);
}

/** 7. 10. 2026 */
export function formatDate(value: string): string {
  return dateFmt.format(parseDate(value));
}

/** 7. říj */
export function formatDateShort(value: string): string {
  return dateShortFmt.format(parseDate(value));
}

/** "2026-03" → "bře" */
export function formatMonthShort(month: string): string {
  return monthFmt.format(parseDate(`${month}-01`)).replace(".", "");
}

/** "2026-03" → "březen 2026" */
export function formatMonthLong(month: string): string {
  return monthLongFmt.format(parseDate(`${month}-01`));
}

/** "před 3 h", "před 2 dny" – relativně k referenčnímu datu dema (nebo zadanému „teď“) */
export function formatRelative(value: string, now: Date = REFERENCE_DATE): string {
  const diff = (now.getTime() - parseDate(value).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("cs-CZ", { numeric: "auto" });
  if (Math.abs(diff) < 60) return "právě teď";
  if (Math.abs(diff) < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (Math.abs(diff) < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (Math.abs(diff) < 86400 * 30) return rtf.format(-Math.round(diff / 86400), "day");
  if (Math.abs(diff) < 86400 * 365) return rtf.format(-Math.round(diff / (86400 * 30)), "month");
  return rtf.format(-Math.round(diff / (86400 * 365)), "year");
}

export function initials(name: string): string {
  return name
    .replace(/^(Ing\.|MUDr\.|JUDr\.|arch\.)\s*/g, "")
    .split(/\s+/)
    .filter((part) => !part.endsWith("."))
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
