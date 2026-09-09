import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMyShops, useShopTransactions } from "@/hooks/useEman";
import { summarise } from "@/lib/api";
import {
  downloadCsv,
  formatMoney,
  rangeStart,
  TRANSACTION_TYPES,
  type DateRangeKey,
} from "@/lib/eman";
import { EmptyState, ListSkeleton, PageHeader, StatCard } from "@/components/ui-kit";
import { TransactionList } from "@/components/TransactionList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranslationKey } from "@/i18n/translations";

export const Route = createFileRoute("/_authenticated/transactions/")({
  component: TransactionsPage,
});

const RANGES: DateRangeKey[] = ["today", "week", "month", "year", "all"];

function TransactionsPage() {
  const { t, locale } = useI18n();
  const [range, setRange] = useState<DateRangeKey>("month");
  const [shopFilter, setShopFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [term, setTerm] = useState("");

  const { data: shops } = useMyShops();
  const shopIds = useMemo(() => (shops ?? []).map((s) => s.id), [shops]);
  const { data: txs, isLoading } = useShopTransactions(shopIds, rangeStart(range));

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (txs ?? []).filter((tx) => {
      if (shopFilter !== "all" && tx.shop_id !== shopFilter) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (!q) return true;
      return [tx.product, tx.description, tx.customer_name, tx.notes]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [txs, shopFilter, typeFilter, term]);

  const stats = summarise(filtered);

  return (
    <div>
      <PageHeader
        title={t("tx.title")}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  `eman-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
                  filtered.map((tx) => ({
                    date: tx.occurred_at,
                    shop: tx.shop?.name ?? "",
                    type: tx.type,
                    product: tx.product ?? "",
                    quantity: tx.quantity,
                    unit_price: tx.unit_price,
                    total: tx.total_amount,
                    currency: tx.currency,
                    payment_method: tx.payment_method ?? "",
                    customer: tx.customer_name ?? "",
                    created_by: tx.creator?.full_name ?? "",
                    voided: tx.is_voided,
                  })),
                )
              }
              disabled={filtered.length === 0}
            >
              <Download className="size-4" />
              <span className="ms-2 hidden sm:inline">{t("common.export")}</span>
            </Button>
            <Link to="/transactions/new">
              <Button>
                <Plus className="size-4" />
                <span className="ms-2">{t("tx.add")}</span>
              </Button>
            </Link>
          </div>
        }
      />

      <Tabs value={range} onValueChange={(v) => setRange(v as DateRangeKey)} className="mb-4">
        <TabsList className="flex-wrap">
          {RANGES.map((r) => (
            <TabsTrigger key={r} value={r}>
              {t(r === "all" ? "common.all" : (`common.${r}` as TranslationKey))}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select value={shopFilter} onValueChange={setShopFilter}>
          <SelectTrigger aria-label={t("tx.shop")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {(shops ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger aria-label={t("tx.type")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {TRANSACTION_TYPES.map((ty) => (
              <SelectItem key={ty} value={ty}>
                {t(("tx.type." + ty) as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("common.search")}
          aria-label={t("common.search")}
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("dash.income")} value={formatMoney(stats.income, locale)} />
        <StatCard label={t("dash.expenses")} value={formatMoney(stats.expenses, locale)} />
        <StatCard label={t("dash.net")} value={formatMoney(stats.net, locale)} />
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("tx.empty")} />
      ) : (
        <TransactionList items={filtered} />
      )}
    </div>
  );
}
