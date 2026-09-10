import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { profileComplete } from "@/lib/eman";
import { uploadTo, validateUpload } from "@/lib/storage";
import { PageHeader } from "@/components/ui-kit";
import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — EMAN" },
      { name: "description", content: "Update your EMAN profile details, contact numbers and picture." },
      { property: "og:title", content: "Your profile — EMAN" },
      { property: "og:description", content: "Keep your EMAN account details up to date." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useI18n();
  const { profile, isAdmin, refreshProfile, session } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    username: profile?.username ?? "",
    whatsapp: profile?.whatsapp ?? "",
    phone: profile?.phone ?? "",
    resident_area: profile?.resident_area ?? "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const complete = profileComplete({ ...profile, ...form });
  const roleKey = isAdmin
    ? "profile.role.admin"
    : profile?.role === "owner"
      ? "profile.role.owner"
      : "profile.role.worker";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !profile) return;
    if (form.full_name.trim().length < 2 || !/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) {
      toast.error(t("auth.usernameRule"));
      return;
    }
    setBusy(true);
    try {
      let avatarPath: string | undefined;
      if (avatar) {
        const problem = validateUpload(avatar);
        if (problem) throw new Error(problem);
        avatarPath = await uploadTo("avatars", profile.id, avatar);
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          username: form.username.trim(),
          whatsapp: form.whatsapp.trim() || null,
          phone: form.phone.trim() || null,
          resident_area: form.resident_area.trim() || null,
          ...(avatarPath ? { avatar_url: avatarPath } : {}),
        })
        .eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      setAvatar(null);
      toast.success(t("profile.updated"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("profile.title")} subtitle={session?.user.email ?? undefined} />

      {!complete && (
        <div className="surface-card mb-6 border-warning/40 p-4">
          <p className="font-semibold text-warning">{t("auth.completeProfile")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.completeProfileHint")}</p>
        </div>
      )}

      <div className="surface-card p-6">
        <div className="mb-6 flex items-center gap-4">
          <StoredImage
            path={profile?.avatar_url}
            alt={profile?.full_name ?? ""}
            className="size-16 rounded-full"
            fallback={<User className="size-6" />}
          />
          <div>
            <p className="font-semibold">{profile?.full_name || "—"}</p>
            <p className="text-sm text-muted-foreground">{t(roleKey)}</p>
          </div>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
          <div className="space-y-2">
            <Label htmlFor="full_name">{t("auth.fullName")}</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">{t("auth.username")}</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">{t("auth.whatsapp")}</Label>
            <Input
              id="whatsapp"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="area">{t("auth.area")}</Label>
            <Input
              id="area"
              value={form.resident_area}
              onChange={(e) => setForm({ ...form, resident_area: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="avatar">{t("auth.picture")}</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" className="sm:col-span-2" disabled={busy}>
            {busy ? t("common.saving") : t("common.save")}
          </Button>
        </form>
      </div>
    </div>
  );
}
