import type { TranslationKey } from "@/i18n/translations";

export const PAYMENT_NUMBER = "33313301";
export const SUPPORT_WHATSAPP = "33313301";

export type PlanId = "bronze" | "silver" | "gold" | "platinum";

export const PLANS: {
  id: PlanId;
  price: number;
  maxShops: number;
  maxWorkers: number;
  nameKey: TranslationKey;
}[] = [
  { id: "bronze", price: 5000, maxShops: 3, maxWorkers: 2, nameKey: "sub.bronze" },
  { id: "silver", price: 8000, maxShops: 5, maxWorkers: 4, nameKey: "sub.silver" },
  { id: "gold", price: 14000, maxShops: 10, maxWorkers: 9, nameKey: "sub.gold" },
  { id: "platinum", price: 20000, maxShops: 50, maxWorkers: 50, nameKey: "sub.platinum" },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<
  PlanId,
  (typeof PLANS)[number]
>;

export const TRANSACTION_TYPES = [
  "sale",
  "purchase",
  "expense",
  "income",
  "refund",
  "debt",
  "payment_received",
  "payment_sent",
  "other",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = ["cash", "bankily", "sedad", "masrivi", "bank", "credit"] as const;

export const CASH_MOVEMENT_TYPES = [
  "cash_added",
  "cash_removed",
  "bank_deposit",
  "withdrawal",
  "adjustment",
] as const;

export const INCOME_TYPES: TransactionType[] = ["sale", "income", "payment_received"];
export const EXPENSE_TYPES: TransactionType[] = ["purchase", "expense", "refund", "payment_sent"];

export function formatMoney(amount: number, locale = "en", currency = "MRU") {
  const intlLocale = locale === "ar" ? "ar-MR" : locale === "fr" ? "fr-MR" : "en-US";
  const formatted = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(
    Number.isFinite(amount) ? amount : 0,
  );
  return `${formatted} ${currency}`;
}

export function formatDate(value: string | Date, locale = "en") {
  const d = typeof value === "string" ? new Date(value) : value;
  const intlLocale = locale === "ar" ? "ar-MR" : locale === "fr" ? "fr-FR" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium" }).format(d);
}

export function formatTime(value: string | Date, locale = "en") {
  const d = typeof value === "string" ? new Date(value) : value;
  const intlLocale = locale === "ar" ? "ar-MR" : locale === "fr" ? "fr-FR" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, { timeStyle: "short" }).format(d);
}

export type DateRangeKey = "today" | "yesterday" | "week" | "month" | "year" | "all";

export function rangeStart(key: DateRangeKey): Date | null {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today":
      return d;
    case "yesterday":
      return new Date(d.getTime() - 86400000);
    case "week": {
      const day = d.getDay();
      return new Date(d.getTime() - day * 86400000);
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}

export function friendlyError(error: unknown): string | null {
  if (!error) return null;
  const message = (error as { message?: string })?.message ?? String(error);
  if (/duplicate key|23505/i.test(message)) {
    if (/username/i.test(message)) return "auth.usernameTaken";
    return "common.error";
  }
  if (/invalid login credentials/i.test(message)) return "auth.invalidCredentials";
  if (/already registered|user already/i.test(message)) return "auth.emailTaken";
  if (/password/i.test(message) && /6|8|short|weak|pwned|compromised/i.test(message))
    return "auth.weakPassword";
  return "common.error";
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
