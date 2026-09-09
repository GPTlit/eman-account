import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { audit } from "@/lib/api";
import { formatDate, formatMoney, formatTime } from "@/lib/eman";
import { signedUrl } from "@/lib/storage";
import { EmptyState, ListSkeleton, PageHeader, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/i18n/translations";

export const Route = createFileRoute("/_authenticated/transactions/$txId")({
  component: TransactionDetailPage,
});

function TransactionDetailPage() {
  const { txId } = useParams({ from: "/_authenticated/transactions/$txId" });
  const { t, locale } = useI18n();
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: tx, isLoading } = useQuery({
    queryKey: ["tx", txId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, shop:shops(id,name,owner_id), creator:profiles!transactions_created_by_fkey(id,full_name,username)")
        .eq("id", txId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <ListSkeleton rows={5} />;
  if (!tx) return <EmptyState title={t("tx.empty")} />;

  const shop = tx.shop as { id: string; name: string; owner_id: string } | null;
  const creator = tx.creator as { full_name: string; username: string } | null;
  const canVoid = (shop?.owner_id === profile?.id || isAdmin) && !tx.is_voided;

  async function voidTx() {
    if (!profile) return;
    if (!confirm(t("tx.voidConfirm"))) return;
    const { error } = await supabase.from("transactions").update({ is_voided: true }).eq("id", txId);
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    await audit(profile.id, "transaction_voided", "transaction", txId);
    await qc.invalidateQueries();
    toast.success(t("tx.voided"));
  }

  async function openReceipt() {
    const url = await signedUrl(tx?.receipt_url);
    if (!url) {
      toast.error(t("common.error"));
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  const rows: [string, string][] = [
    [t("tx.type"), t(("tx.type." + tx.type) as TranslationKey)],
    [t("tx.shop"), shop?.name ?? "—"],
    [t("tx.product"), tx.product ?? "—"],
    [t("tx.quantity"), String(tx.quantity)],
    [t("tx.unitPrice"), formatMoney(Number(tx.unit_price), locale, tx.currency)],
    [t("tx.total"), formatMoney(Number(tx.total_amount), locale, tx.currency)],
    [t("tx.paymentMethod"), tx.payment_method ? t(("pay." + tx.payment_method) as TranslationKey) : "—"],
    [t("tx.customerName"), tx.customer_name ?? "—"],
    [t("tx.customerPhone"), tx.customer_phone ?? "—"],
    [t("tx.createdBy"), creator?.full_name ?? "—"],
    [t("common.date"), `${formatDate(tx.occurred_at, locale)} ${formatTime(tx.occurred_at, locale)}`],
    [t("tx.notes"), tx.notes ?? "—"],
    [t("tx.description"), tx.description ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={tx.product || t(("tx.type." + tx.type) as TranslationKey)}
        subtitle={formatMoney(Number(tx.total_amount), locale, tx.currency)}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void navigate({ to: "/transactions" })}>
              {t("common.back")}
            </Button>
            {canVoid && (
              <Button variant="destructive" onClick={() => void voidTx()}>
                {t("tx.void")}
              </Button>
            )}
          </div>
        }
      />

      {tx.is_voided && (
        <div className="mb-4">
          <StatusBadge status="cancelled" />
        </div>
      )}

      <dl className="surface-card divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 p-4 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-end font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {tx.receipt_url && (
        <Button className="mt-4" variant="outline" onClick={() => void openReceipt()}>
          {t("tx.receipt")}
        </Button>
      )}
    </div>
  );
}
