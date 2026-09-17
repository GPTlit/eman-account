import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth";
import { fetchSubscription, subscriptionIsValid } from "@/lib/api";
import {
  PAYMENT_NUMBER,
  PLANS,
  SUPPORT_WHATSAPP,
  formatDate,
  formatMoney,
  profileComplete,
  type PlanId,
} from "@/lib/eman";
import { uploadTo } from "@/lib/storage";
import { PageHeader, PlanBadge, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/subscription")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Subscription — EMAN" },
      { name: "description", content: "Choose an EMAN yearly plan and submit your payment for approval." },
      { property: "og:title", content: "Subscription — EMAN" },
      { property: "og:description", content: "Bronze, Silver, Gold and Platinum plans for EMAN owners." },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const subQuery = useQuery({
    queryKey: ["subscription", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: () => fetchSubscription(profile!.id),
  });

  const requestsQuery = useQuery({
    queryKey: ["sub-requests", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_requests")
        .select("*")
        .eq("owner_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sub = subQuery.data ?? null;
  const valid = subscriptionIsValid(sub);
  const complete = profileComplete(profile);
  const pending = (requestsQuery.data ?? []).some((r) => r.status === "pending");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !plan || !profile) return;
    if (!complete) {
      toast.error(t("sub.needProfile"));
      return;
    }
    setBusy(true);
    try {
      const [idPath, receiptPath] = await Promise.all([
        idDoc ? uploadTo("documents", profile.id, idDoc) : Promise.resolve(null),
        receipt ? uploadTo("documents", profile.id, receipt) : Promise.resolve(null),
      ]);
      const { error } = await supabase.from("subscription_requests").insert({
        owner_id: profile.id,
        plan,
        full_name: profile.full_name,
        username: profile.username,
        resident_area: profile.resident_area,
        whatsapp: profile.whatsapp,
        phone: profile.phone,
        id_document_path: idPath,
        receipt_path: receiptPath,
      });
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: profile.id,
        title_key: "notif.subSubmitted",
      });
      toast.success(t("sub.submitted"));
      setPlan(null);
      setIdDoc(null);
      setReceipt(null);
      void qc.invalidateQueries({ queryKey: ["sub-requests", profile.id] });
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("sub.title")} subtitle={t("sub.payHint")} />

      {subQuery.isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : valid && sub ? (
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <PlanBadge plan={sub.plan as PlanId} />
            <div>
              <p className="font-semibold">{t("sub.current")}</p>
              <p className="text-sm text-muted-foreground">
                {t("sub.activeUntil")}: {formatDate(sub.ends_at, locale)}
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {sub.max_shops} {t("sub.maxShops")} · {sub.max_workers} {t("sub.maxWorkers")}
          </div>
        </div>
      ) : (
        <div className="surface-card p-5">
          <p className="font-semibold">{sub ? t("sub.expired") : t("sub.none")}</p>
          {sub && <p className="mt-1 text-sm text-muted-foreground">{t("sub.expiredHint")}</p>}
        </div>
      )}

      {!complete && (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-semibold">{t("auth.completeProfile")}</p>
          <p className="mt-1 text-muted-foreground">{t("sub.needProfile")}</p>
          <Link to="/profile" className="mt-3 inline-block">
            <Button size="sm">{t("profile.completeCta")}</Button>
          </Link>
        </div>
      )}

      {pending && (
        <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <p className="font-semibold">{t("sub.waiting")}</p>
          <p className="mt-1 text-muted-foreground">{t("sub.waitingMsg")}</p>
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">{t("sub.plan")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              aria-pressed={plan === p.id}
              disabled={!complete}
              className={cn(
                "surface-card animate-rise p-5 text-start transition-colors disabled:opacity-60",
                plan === p.id && "border-primary ring-1 ring-primary",
              )}
            >
              <PlanBadge plan={p.id} />
              <p className="mt-3 text-2xl font-bold">{formatMoney(p.price, locale)}</p>
              <p className="text-xs text-muted-foreground">{t("sub.perYear")}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> {p.maxShops} {t("sub.maxShops")}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> {p.maxWorkers} {t("sub.maxWorkers")}
                </li>
              </ul>
              <span className="mt-4 inline-block text-sm font-medium text-primary">
                {plan === p.id ? t("sub.choose") : t("sub.apply")}
              </span>
            </button>
          ))}
        </div>
      </section>

      {plan && complete && (
        <section className="surface-card mt-8 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="size-5 text-primary" /> {t("sub.payTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("sub.payHint")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{t("sub.payNumber")}</p>
              <p className="font-semibold" dir="ltr">
                {PAYMENT_NUMBER}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{t("sub.whatsapp")}</p>
              <a
                className="font-semibold text-primary"
                dir="ltr"
                href={`https://wa.me/222${SUPPORT_WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
              >
                {SUPPORT_WHATSAPP}
              </a>
            </div>
          </div>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="idDoc">{t("sub.idDoc")}</Label>
              <Input
                id="idDoc"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdDoc(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt">{t("sub.receipt")}</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">{t("sub.docsNotice")}</p>
            <Button type="submit" className="sm:col-span-2" disabled={busy}>
              {busy ? t("common.uploading") : t("sub.submit")}
            </Button>
          </form>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">{t("sub.requestHistory")}</h2>
        {requestsQuery.isLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : (requestsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {(requestsQuery.data ?? []).map((r) => (
              <li
                key={r.id}
                className="surface-card flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <PlanBadge plan={r.plan as PlanId} />
                  <span className="text-sm text-muted-foreground">{formatDate(r.created_at, locale)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {r.admin_note && <span className="text-xs text-muted-foreground">{r.admin_note}</span>}
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
