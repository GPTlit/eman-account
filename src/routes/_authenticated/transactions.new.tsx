import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { useMyShops } from "@/hooks/useEman";
import { uploadTo, validateUpload } from "@/lib/storage";
import { PAYMENT_METHODS, TRANSACTION_TYPES, formatMoney } from "@/lib/eman";
import { EmptyState, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TranslationKey } from "@/i18n/translations";

export const Route = createFileRoute("/_authenticated/transactions/new")({
  component: NewTransactionPage,
});

function NewTransactionPage() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: shops } = useMyShops();

  const [form, setForm] = useState({
    shopId: "",
    type: "sale",
    product: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    paymentMethod: "cash",
    customerName: "",
    customerPhone: "",
    notes: "",
    occurredAt: new Date().toISOString().slice(0, 16),
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const total = useMemo(
    () => (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0),
    [form.quantity, form.unitPrice],
  );

  const shopId = form.shopId || shops?.[0]?.id || "";

  if ((shops ?? []).length === 0) {
    return (
      <div>
        <PageHeader title={t("tx.add")} />
        <EmptyState title={t("shops.empty")} />
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !profile) return;
    if (!shopId) {
      toast.error(t("auth.required"));
      return;
    }
    setBusy(true);
    try {
      let receiptPath: string | null = null;
      if (receipt) {
        const problem = validateUpload(receipt);
        if (problem) throw new Error(problem);
        receiptPath = await uploadTo("receipts", shopId, receipt);
      }
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          shop_id: shopId,
          created_by: profile.id,
          type: form.type as never,
          product: form.product.trim() || null,
          description: form.description.trim() || null,
          quantity: Number(form.quantity) || 1,
          unit_price: Number(form.unitPrice) || 0,
          total_amount: total,
          payment_method: form.paymentMethod,
          customer_name: form.customerName.trim() || null,
          customer_phone: form.customerPhone.trim() || null,
          notes: form.notes.trim() || null,
          occurred_at: new Date(form.occurredAt).toISOString(),
          receipt_url: receiptPath,
        })
        .select()
        .single();
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success(t("tx.created"));
      void navigate({ to: "/transactions/$txId", params: { txId: data.id } });
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("tx.add")} />
      <form className="surface-card space-y-4 p-5" onSubmit={submit}>
        <div className="space-y-2">
          <Label>{t("tx.shop")}</Label>
          <Select value={shopId} onValueChange={set("shopId")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(shops ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("tx.type")}</Label>
          <Select value={form.type} onValueChange={set("type")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((ty) => (
                <SelectItem key={ty} value={ty}>
                  {t(("tx.type." + ty) as TranslationKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product">{t("tx.product")}</Label>
          <Input id="product" value={form.product} onChange={(e) => set("product")(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="qty">{t("tx.quantity")}</Label>
            <Input
              id="qty"
              type="number"
              min="0"
              step="0.01"
              value={form.quantity}
              onChange={(e) => set("quantity")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{t("tx.unitPrice")}</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => set("unitPrice")(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">{t("tx.total")}</p>
          <p className="text-2xl font-bold text-primary">{formatMoney(total, locale)}</p>
        </div>

        <div className="space-y-2">
          <Label>{t("tx.paymentMethod")}</Label>
          <Select value={form.paymentMethod} onValueChange={set("paymentMethod")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(("pay." + m) as TranslationKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer">{t("tx.customerName")}</Label>
            <Input id="customer" value={form.customerName} onChange={(e) => set("customerName")(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cphone">{t("tx.customerPhone")}</Label>
            <Input id="cphone" value={form.customerPhone} onChange={(e) => set("customerPhone")(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="occurred">{t("common.date")}</Label>
          <Input
            id="occurred"
            type="datetime-local"
            value={form.occurredAt}
            onChange={(e) => set("occurredAt")(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">{t("tx.notes")}</Label>
          <Textarea id="notes" value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receipt">
            {t("tx.receipt")} <span className="text-muted-foreground">({t("common.optional")})</span>
          </Label>
          <Input
            id="receipt"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={busy}>
            {busy ? t("common.saving") : t("common.save")}
          </Button>
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/transactions" })}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
