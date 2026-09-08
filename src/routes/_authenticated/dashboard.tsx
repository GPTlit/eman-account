import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store, Users, Receipt, TrendingUp, TrendingDown, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { useMyShops, useMyWorkers, useShopTransactions, useSubscription } from "@/hooks/useEman";
import { summarise } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, rangeStart, type DateRangeKey } from "@/lib/eman";
import { CardsSkeleton, EmptyState, ListSkeleton, PageHeader, PlanBadge, StatCard } from "@/components/ui-kit";
import { TransactionList } from "@/components/TransactionList";
import { DailyAreaChart } from "@/components/Charts";
import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlanId } from "@/lib/eman";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const RANGES: DateRangeKey[] = ["today", "week", "month", "year", "all"];

function DashboardPage() {
  const { profile } = useAuth();
  if (profile?.role === "worker") return <WorkerDashboard />;
  return <OwnerDashboard />;
}

function OwnerDashboard() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const [range, setRange] = useState<DateRangeKey>("month");
  const { data: shops, isLoading: shopsLoading } = useMyShops();
  const shopIds = useMemo(() => (shops ?? []).map((s) => s.id), [shops]);
  const { data: txs, isLoading: txLoading } = useShopTransactions(shopIds, rangeStart(range));
  const { data: sub } = useSubscription();
  const { data: workers } = useMyWorkers();

  const stats = summarise(txs ?? []);
  const activeWorkers = (workers ?? []).filter((w) => w.status === "approved").length;

  const daily = useMemo(() => {
    const map = new Map<string, { label: string; income: number; expenses: number }>();
    for (const tx of txs ?? []) {
      if (tx.is_voided) continue;
      const key = new Date(tx.occurred_at).toISOString().slice(0, 10);
      const entry = map.get(key) ?? { label: key.slice(5), income: 0, expenses: 0 };
      const amount = Number(tx.total_amount);
      if (["sale", "income", "payment_received"].includes(tx.type)) entry.income += amount;
      else entry.expenses += amount;
      map.set(key, entry);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [txs]);

  return (
    <div>
      <PageHeader
        title={`${t("dash.welcome")}${profile?.full_name ? `, ${profile.full_name}` : ""}`}
        subtitle={profile?.username ? `@${profile.username}` : undefined}
        action={
          <div className="flex items-center gap-2">
            {sub && <PlanBadge plan={sub.plan as PlanId} />}
            <Link to="/transactions/new">
              <Button>{t("tx.add")}</Button>
            </Link>
          </div>
        }
      />

      <Tabs value={range} onValueChange={(v) => setRange(v as DateRangeKey)} className="mb-5">
        <TabsList className="flex-wrap">
          {RANGES.map((r) => (
            <TabsTrigger key={r} value={r}>
              {t(r === "all" ? "common.all" : (`common.${r}` as never))}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <StatCard
        featured
        label={t("dash.totalRevenue")}
        value={formatMoney(stats.net, locale)}
        hint={`${t("dash.income")}: ${formatMoney(stats.income, locale)} · ${t("dash.expenses")}: ${formatMoney(stats.expenses, locale)}`}
        className="mb-4"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("dash.income")} value={formatMoney(stats.income, locale)} icon={<TrendingUp className="size-4" />} />
        <StatCard label={t("dash.expenses")} value={formatMoney(stats.expenses, locale)} icon={<TrendingDown className="size-4" />} />
        <StatCard label={t("dash.txCount")} value={stats.count} icon={<Receipt className="size-4" />} />
        <StatCard label={t("dash.shopsCount")} value={shops?.length ?? 0} icon={<Store className="size-4" />} />
        <StatCard label={t("dash.workersCount")} value={activeWorkers} icon={<Users className="size-4" />} />
        <StatCard label={t("dash.sales")} value={formatMoney(stats.sales, locale)} />
        <StatCard label={t("dash.debts")} value={formatMoney(stats.debts, locale)} />
        <StatCard label={t("dash.refunds")} value={formatMoney(stats.refunds, locale)} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">{t("dash.yourShops")}</h2>
        {shopsLoading ? (
          <CardsSkeleton />
        ) : (shops ?? []).length === 0 ? (
          <EmptyState title={t("shops.empty")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(shops ?? []).map((shop) => {
              const shopStats = summarise((txs ?? []).filter((x) => x.shop_id === shop.id));
              return (
                <Link key={shop.id} to="/shops/$shopId" params={{ shopId: shop.id }} className="surface-card animate-rise overflow-hidden transition-transform hover:-translate-y-0.5">
                  <StoredImage
                    path={shop.image_url}
                    alt={shop.name}
                    className="h-28 w-full"
                    fallback={<Store className="size-6" />}
                  />
                  <div className="p-4">
                    <p className="font-semibold">{shop.name}</p>
                    <p className="text-xs text-muted-foreground">{shop.category || shop.location}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("dash.income")}</p>
                        <p className="font-semibold text-primary">{formatMoney(shopStats.income, locale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("dash.expenses")}</p>
                        <p className="font-semibold">{formatMoney(shopStats.expenses, locale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("dash.net")}</p>
                        <p className="font-semibold">{formatMoney(shopStats.net, locale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("dash.txCount")}</p>
                        <p className="font-semibold">{shopStats.count}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">{t("dash.performance")}</h2>
        <div className="surface-card p-4">
          {daily.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("reports.empty")}</p>
          ) : (
            <DailyAreaChart data={daily} />
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("dash.recent")}</h2>
          <Link to="/transactions" className="text-sm text-primary">
            {t("common.view")}
          </Link>
        </div>
        {txLoading ? (
          <ListSkeleton />
        ) : (txs ?? []).length === 0 ? (
          <EmptyState title={t("tx.empty")} />
        ) : (
          <TransactionList items={(txs ?? []).slice(0, 8)} />
        )}
      </section>
    </div>
  );
}

function WorkerDashboard() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const { data: shops, isLoading } = useMyShops();
  const shopIds = useMemo(() => (shops ?? []).map((s) => s.id), [shops]);
  const { data: txs } = useShopTransactions(shopIds, rangeStart("month"));
  const stats = summarise(txs ?? []);

  return (
    <div>
      <PageHeader
        title={`${t("auth.welcome")}${profile?.full_name ? `, ${profile.full_name}` : ""}`}
        action={
          <Link to="/transactions/new">
            <Button>{t("tx.add")}</Button>
          </Link>
        }
      />

      <FindOwnerPanel />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard featured label={t("dash.income")} value={formatMoney(stats.income, locale)} />
        <StatCard label={t("dash.expenses")} value={formatMoney(stats.expenses, locale)} />
        <StatCard label={t("dash.txCount")} value={stats.count} />
      </div>

      <h2 className="mb-3 text-lg font-semibold">{t("nav.myShop")}</h2>
      {isLoading ? (
        <CardsSkeleton count={2} />
      ) : (shops ?? []).length === 0 ? (
        <EmptyState title={t("shops.empty")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(shops ?? []).map((shop) => (
            <Link key={shop.id} to="/shops/$shopId" params={{ shopId: shop.id }} className="surface-card p-4">
              <p className="font-semibold">{shop.name}</p>
              <p className="text-xs text-muted-foreground">{shop.category || shop.location}</p>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-semibold">{t("dash.recent")}</h2>
      {(txs ?? []).length === 0 ? <EmptyState title={t("tx.empty")} /> : <TransactionList items={(txs ?? []).slice(0, 10)} />}
    </div>
  );
}

function FindOwnerPanel() {
  const { t } = useI18n();
  const { profile, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Tables<"profiles">[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [myRequests, setMyRequests] = useState<Tables<"worker_requests">[] | null>(null);

  useMemo(() => {
    if (!profile?.id) return;
    void supabase
      .from("worker_requests")
      .select("*")
      .eq("worker_id", profile.id)
      .then(({ data }) => setMyRequests(data ?? []));
  }, [profile?.id]);

  const approved = myRequests?.find((r) => r.status === "approved");
  const pending = myRequests?.find((r) => r.status === "pending");

  if (approved) return null;

  async function search() {
    setBusy(true);
    const clean = term.trim().replace(/^@/, "");
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "owner")
      .ilike("username", `%${clean}%`)
      .limit(10);
    setResults(data ?? []);
    setSearched(true);
    setBusy(false);
  }

  async function sendRequest(ownerId: string) {
    if (!profile) return;
    const { error } = await supabase
      .from("worker_requests")
      .insert({ worker_id: profile.id, owner_id: ownerId });
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    await supabase
      .from("notifications")
      .insert({ user_id: ownerId, title_key: "notif.workerRequest", body: `@${profile.username}` });
    toast.success(t("worker.requestSent"));
    const { data } = await supabase.from("worker_requests").select("*").eq("worker_id", profile.id);
    setMyRequests(data ?? []);
    void refreshProfile();
    void qc.invalidateQueries();
  }

  return (
    <div className="surface-card mb-6 p-5">
      <h2 className="font-semibold">{t("worker.findOwner")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {pending ? t("worker.requestPending") : t("worker.findOwnerHint")}
      </p>
      {!pending && (
        <>
          <div className="mt-4 flex gap-2">
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="@salem"
              onKeyDown={(e) => e.key === "Enter" && void search()}
              aria-label={t("common.search")}
            />
            <Button onClick={() => void search()} disabled={busy}>
              <Search className="size-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {searched && results.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("worker.noResults")}</p>
            )}
            {results.map((owner) => (
              <div key={owner.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <StoredImage
                  path={owner.avatar_url}
                  alt={owner.full_name}
                  className="size-10 rounded-full"
                  fallback={<Users className="size-4" />}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{owner.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{owner.username}</p>
                </div>
                <Button size="sm" onClick={() => void sendRequest(owner.id)}>
                  {t("worker.sendRequest")}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
