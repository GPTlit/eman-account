import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import { formatDate, formatMoney, formatTime, INCOME_TYPES } from "@/lib/eman";
import type { TxWithRefs } from "@/lib/api";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

export function TransactionList({ items }: { items: TxWithRefs[] }) {
  const { t, locale } = useI18n();
  return (
    <ul className="space-y-2">
      {items.map((tx) => {
        const income = INCOME_TYPES.includes(tx.type as never);
        return (
          <li key={tx.id}>
            <Link
              to="/transactions/$txId"
              params={{ txId: tx.id }}
              className="surface-card flex items-center gap-3 p-4 transition-colors hover:bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {tx.product || t(("tx.type." + tx.type) as TranslationKey)}
                  {tx.is_voided && (
                    <span className="ms-2 text-xs text-destructive">({t("tx.isVoided")})</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {tx.shop?.name} · {tx.creator?.full_name || tx.creator?.username} ·{" "}
                  {formatDate(tx.occurred_at, locale)} {formatTime(tx.occurred_at, locale)}
                </p>
              </div>
              <div className="text-end">
                <p
                  className={cn(
                    "font-semibold",
                    tx.is_voided ? "text-muted-foreground line-through" : income ? "text-primary" : "text-foreground",
                  )}
                >
                  {income ? "+" : "−"}
                  {formatMoney(Number(tx.total_amount), locale, tx.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(("tx.type." + tx.type) as TranslationKey)}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
