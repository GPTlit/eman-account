import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMyShops, useShopTransactions } from "@/hooks/useEman";
import { summarise } from "@/lib/api";
import {
  downloadCsv,
  formatDate,
  formatMoney,
  rangeStart,
  TRANSACTION_TYPES,
  type DateRangeKey,
} from "@/lib/eman";
import { CardsSkeleton, EmptyState, PageHeader, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — EMAN" },
      { name: "description", content: "Revenue, shop performance and worker activity reports for your business." },
      { property: "og:title", content: "Reports — EMAN" },
      { property: "og:description", content: "Analyse income, expenses and activity across all your shops." },
    ],
  }),
  component: ReportsPage,
});

const RANGES: { key: DateRangeKey; labelKey: TranslationKey }[] = [
  { key: "today", labelKey: "common.today" },
  { key: "week", labelKey: "common.week" },
  { key: "month", labelKey: "common.month" },
  { key: "year", labelKey: "common.year" },
  { key: "all", labelKey: "common.all" },
];

function ReportsPage() {
  const { t, locale } = useI18n();
  const [range, setRange] = useState<DateRangeKey>("month");
  const { data: shops, isLoading: shopsLoading } = useMyShops();
  const shopIds = useMemo(() => (shops ?? []).map((s) => s.id), [shops]);
  const { data: txs, isLoading } = useShopTransactions(shopIds, rangeStart(range));

  const rows = useMemo(() => (txs ?? []).filter((tx) => !tx.is_voided), [txs]);
  const totals = useMemo(() => summarise(rows), [rows]);

  const byShop = useMemo(() => {
    const map = new Map<string, { name: string; income: number; expenses: number; count: number }>();
    for (const tx of rows) {
      const id = tx.shop_id;
      const name = tx.shop?.name ?? "—";
      const entry = map.get(id) ?? { name, income: 0, expenses: 0, count: 0 };
      const stats = summarise([tx]);
      entry.income += stats.income;
      entry.expenses += stats.expenses;
      entry.count += 1;
      map.set(id, entry);
    }
    return [...map.values()].sort((a, b) => b.income - a.income);
  }, [rows]);

  const byWorker = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const tx of rows) {
      const id = tx.created_by;
      const name = tx.creator?.full_name || tx.creator?.username || "—";
      const entry = map.get(id) ?? { name, total: 0, count: 0 };
      entry.total += Number(tx.total_amount ?? 0);
      entry.count += 1;
      map.set(id, entry);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [rows]);

  const byType = useMemo(
    () =>
      TRANSACTION_TYPES.map((type) => {
        const list = rows.filter((r) => r.type === type);
        return {
          type,
          count: list.length,
          total: list.reduce((acc, r) => acc + Number(r.total_amount ?? 0), 0),
        };
      }).filter((r) => r.count > 0),
    [rows],
  );

  function exportReport() {
    downloadCsv(
      `eman-report-${range}.csv`,
      rows.map((tx) => ({
        date: formatDate(tx.occurred_at, locale),
        shop: tx.shop?.name ?? "",
        type: tx.type,
        product: tx.product ?? "",
        quantity: tx.quantity,
        unit_price: tx.unit_price,
        total: tx.total_amount,
        currency: tx.currency,
        payment_method: tx.payment_method ?? "",
        customer: tx.customer_name ?? "",
        recorded_by: tx.creator?.full_name ?? "",
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title={t("reports.title")}
        action={
          <Button variant="outline" disabled={rows.length === 0} onClick={exportReport}>
            <Download className="size-4" />
            <span className="ms-2">{t("reports.download")}</span>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              range === r.key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {t(r.labelKey)}
          </button>
        ))}
      </div>

      {isLoading || shopsLoading ? (
        <CardsSkeleton count={4} />
      ) : rows.length === 0 ? (
        <EmptyState title={t("reports.empty")} icon={<BarChart3 className="size-8" />} />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t("reports.revenue")} value={formatMoney(totals.net, locale)} featured />
            <StatCard label={t("dash.income")} value={formatMoney(totals.income, locale)} />
            <StatCard label={t("dash.expenses")} value={formatMoney(totals.expenses, locale)} />
            <StatCard label={t("reports.transactions")} value={totals.count} />
          </div>

          <section>
            <h2 className="mb-3 font-semibold">{t("reports.byShop")}</h2>
            <div className="surface-card divide-y divide-border">
              {byShop.map((row) => (
                <div key={row.name} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.count} · {t("dash.expenses")}: {formatMoney(row.expenses, locale)}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">{formatMoney(row.income, locale)}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold">{t("reports.byType")}</h2>
            <div className="surface-card divide-y divide-border">
              {byType.map((row) => (
                <div key={row.type} className="flex items-center justify-between gap-2 p-4">
                  <p className="font-medium">{t(`tx.type.${row.type}` as TranslationKey)}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.count} · {formatMoney(row.total, locale)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold">{t("reports.byWorker")}</h2>
            <div className="surface-card divide-y divide-border">
              {byWorker.map((row) => (
                <div key={row.name} className="flex items-center justify-between gap-2 p-4">
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.count} · {formatMoney(row.total, locale)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
