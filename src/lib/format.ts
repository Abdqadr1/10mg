import type { CurrencyCode } from "@/types";

const LOCALES: Record<CurrencyCode, string> = {
  NGN: "en-NG",
  KES: "en-KE",
  GHS: "en-GH",
  USD: "en-US",
};

export function formatMoney(amount: number, currency: CurrencyCode, options: { compact?: boolean } = {}) {
  return new Intl.NumberFormat(LOCALES[currency], {
    style: "currency",
    currency,
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits: options.compact ? 1 : 2,
    minimumFractionDigits: options.compact ? 0 : 2,
  }).format(amount);
}

export function currencySymbol(currency: CurrencyCode) {
  return (
    new Intl.NumberFormat(LOCALES[currency], { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  );
}

export function formatDate(iso: string | null | undefined, style: "short" | "long" = "short") {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", style === "short" ? { day: "numeric", month: "short", year: "numeric" } : { dateStyle: "full" }).format(new Date(iso));
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatRelative(iso: string, now: Date = new Date()) {
  const diffDays = Math.round((new Date(iso).getTime() - now.getTime()) / 86_400_000);
  if (diffDays === 0) return "today";
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(diffDays, "day");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatMonths(months: number) {
  return `${months} ${months === 1 ? "month" : "months"}`;
}

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
