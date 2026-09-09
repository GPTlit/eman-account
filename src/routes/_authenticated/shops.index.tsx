import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Store, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { useMyShops, useSubscription } from "@/hooks/useEman";
import { uploadTo, validateUpload } from "@/lib/storage";
import { CardsSkeleton, EmptyState, PageHeader } from "@/components/ui-kit";
import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/shops/")({
  component: ShopsPage,
});

function ShopsPage() {
  const { t } = useI18n();
  const { profile, isAdmin } = useAuth();
  const { data: shops, isLoading } = useMyShops();
  const { data: sub } = useSubscription();
  const [open, setOpen] = useState(false);

  const isOwner = profile?.role === "owner" || isAdmin;
  const maxShops = sub?.max_shops ?? 0;
  const atLimit = isOwner && !isAdmin && (shops?.length ?? 0) >= maxShops;

  return (
    <div>
      <PageHeader
        title={t("shops.title")}
        subtitle={isOwner && sub ? `${shops?.length ?? 0} / ${maxShops}` : undefined}
        action={
          isOwner ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={(e) => {
                    if (atLimit) {
                      e.preventDefault();
                      toast.error(t("shops.limitReached"));
                    }
                  }}
                >
                  <Plus className="size-4" />
                  <span className="ms-2">{t("shops.add")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("shops.add")}</DialogTitle>
                </DialogHeader>
                <ShopForm onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {isLoading ? (
        <CardsSkeleton count={3} />
      ) : (shops ?? []).length === 0 ? (
        <EmptyState title={t("shops.empty")} icon={<Store className="size-8" />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(shops ?? []).map((shop) => (
            <Link
              key={shop.id}
              to="/shops/$shopId"
              params={{ shopId: shop.id }}
              className="surface-card animate-rise overflow-hidden transition-transform hover:-translate-y-0.5"
            >
              <StoredImage
                path={shop.image_url}
                alt={shop.name}
                className="h-32 w-full"
                fallback={<Store className="size-6" />}
              />
              <div className="p-4">
                <p className="font-semibold">{shop.name}</p>
                <p className="text-xs text-muted-foreground">{shop.category || shop.location || "—"}</p>
                {shop.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{shop.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ShopForm({
  shop,
  onDone,
}: {
  shop?: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    location: string | null;
  };
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: shop?.name ?? "",
    description: shop?.description ?? "",
    category: shop?.category ?? "",
    location: shop?.location ?? "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !profile) return;
    if (form.name.trim().length < 2) {
      toast.error(t("auth.required"));
      return;
    }
    setBusy(true);
    try {
      let imagePath: string | undefined;
      if (image) {
        const problem = validateUpload(image);
        if (problem) throw new Error(problem);
        imagePath = await uploadTo("shops", profile.id, image);
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        location: form.location.trim() || null,
        ...(imagePath ? { image_url: imagePath } : {}),
      };
      if (shop) {
        const { error } = await supabase.from("shops").update(payload).eq("id", shop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shops").insert({ ...payload, owner_id: profile.id });
        if (error) throw error;
      }
      toast.success(t("common.save"));
      await qc.invalidateQueries();
      onDone();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="shop-name">{t("shops.name")}</Label>
        <Input id="shop-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shop-category">{t("shops.category")}</Label>
          <Input
            id="shop-category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-location">{t("shops.location")}</Label>
          <Input
            id="shop-location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="shop-desc">{t("shops.description")}</Label>
        <Textarea
          id="shop-desc"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shop-image">
          {t("shops.image")} <span className="text-muted-foreground">({t("common.optional")})</span>
        </Label>
        <Input
          id="shop-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
