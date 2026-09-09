import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { summarise, type TxWithRefs } from "@/lib/api";
import { formatMoney, CASH_MOVEMENT_TYPES } from "@/lib/eman";
import { EmptyState, ListSkeleton, PageHeader, StatCard } from "@/components/ui-kit";
import { TransactionList } from "@/components/TransactionList";
import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShopForm } from "./shops.index";
import type { TranslationKey } from "@/i18n/translations";

export const Route = createFileRoute("/_authenticated/shops/$shopId")({
  component: ShopDetailPage,
});

function ShopDetailPage() {
  const { shopId } = useParams({ from: "/_authenticated/shops/$shopId" });
  const { t, locale } = useI18n();
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: shop, isLoading } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: async () => {
      const { data, error } = await supabase.from("shops").select("*").eq("id", shopId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: txs, isLoading: txLoading } = useQuery({
    queryKey: ["shop-tx", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, shop:shops(id,name), creator:profiles!transactions_created_by_fkey(id,full_name,username)")
        .eq("shop_id", shopId)
        .order("occurred_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as TxWithRefs[];
    },
  });

  const { data: cash } = useQuery({
    queryKey: ["shop-cash", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["shop-members", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_members")
        .select("*, worker:profiles!shop_members_worker_id_fkey(id,full_name,username,avatar_url)")
        .eq("shop_id", shopId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isOwner = shop?.owner_id === profile?.id || isAdmin;
  const stats = summarise(txs ?? []);
  const cashBalance = (cash ?? []).reduce((acc, m) => {
    const amount = Number(m.amount);
    return ["cash_added", "adjustment"].includes(m.type) ? acc + amount : acc - amount;
  }, 0);

  if (isLoading) return <ListSkeleton rows={5} />;
  if (!shop) return <EmptyState title={t("shops.empty")} />;

  async function removeShop() {
    if (!confirm(t("common.confirm"))) return;
    const { error } = await supabase.from("shops").delete().eq("id", shopId);
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    await qc.invalidateQueries();
    void navigate({ to: "/shops" });
  }

  return (
    <div>
      <PageHeader
        title={shop.name}
        subtitle={[shop.category, shop.location].filter(Boolean).join(" · ") || undefined}
        action={
          isOwner ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                <span className="ms-2">{t("common.edit")}</span>
              </Button>
              <Button variant="destructive" onClick={() => void removeShop()}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : undefined
        }
      />

      <StoredImage
        path={shop.image_url}
        alt={shop.name}
        className="mb-6 h-40 w-full rounded-2xl"
        fallback={<Store className="size-8" />}
      />

      {shop.description && <p className="mb-6 text-sm text-muted-foreground">{shop.description}</p>}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("dash.income")} value={formatMoney(stats.income, locale)} />
        <StatCard label={t("dash.expenses")} value={formatMoney(stats.expenses, locale)} />
        <StatCard label={t("dash.net")} value={formatMoney(stats.net, locale)} />
        <StatCard label={t("cash.current")} value={formatMoney(cashBalance, locale)} />
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("cash.title")}</h2>
          {isOwner && <CashDialog shopId={shopId} />}
        </div>
        {(cash ?? []).length === 0 ? (
          <EmptyState title={t("cash.empty")} />
        ) : (
          <ul className="space-y-2">
            {(cash ?? []).slice(0, 8).map((m) => (
              <li key={m.id} className="surface-card flex items-center justify-between p-3 text-sm">
                <span>{t(("cash.type." + m.type) as TranslationKey)}</span>
                <span className="font-semibold">{formatMoney(Number(m.amount), locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">{t("shops.workers")}</h2>
        {(members ?? []).length === 0 ? (
          <EmptyState title={t("workers.empty")} />
        ) : (
          <ul className="space-y-2">
            {(members ?? []).map((m) => {
              const worker = m.worker as { full_name: string; username: string } | null;
              return (
                <li key={m.id} className="surface-card flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium">{worker?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{worker?.username}</p>
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await supabase.from("shop_members").delete().eq("id", m.id);
                        await qc.invalidateQueries({ queryKey: ["shop-members", shopId] });
                        toast.success(t("workers.remove"));
                      }}
                    >
                      {t("workers.remove")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("tx.title")}</h2>
        {txLoading ? (
          <ListSkeleton />
        ) : (txs ?? []).length === 0 ? (
          <EmptyState title={t("tx.empty")} />
        ) : (
          <TransactionList items={txs ?? []} />
        )}
      </section>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
          </DialogHeader>
          <ShopForm shop={shop} onDone={() => setEditing(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CashDialog({ shopId }: { shopId: string }) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("cash_added");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || busy) return;
    setBusy(true);
    const { error } = await supabase.from("cash_movements").insert({
      shop_id: shopId,
      created_by: profile.id,
      type: type as never,
      amount: Number(amount) || 0,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    toast.success(t("cash.saved"));
    setAmount("");
    setNotes("");
    setOpen(false);
    await qc.invalidateQueries({ queryKey: ["shop-cash", shopId] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("cash.add")}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cash.add")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label>{t("tx.type")}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASH_MOVEMENT_TYPES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(("cash.type." + c) as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cash-amount">{t("common.amount")}</Label>
            <Input
              id="cash-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cash-notes">{t("tx.notes")}</Label>
            <Textarea id="cash-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? t("common.saving") : t("common.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
