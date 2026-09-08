import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — EMAN" },
      { name: "description", content: "Request a link to reset your EMAN account password." },
      { property: "og:title", content: "Reset password — EMAN" },
      { property: "og:description", content: "Recover access to your EMAN account." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/settings`,
    });
    setBusy(false);
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    setSent(true);
    toast.success(t("auth.resetSent"));
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">{t("auth.reset")}</h1>
        {sent ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("auth.resetSent")}</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t("common.loading") : t("auth.reset")}
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-4 block text-sm text-primary">
          {t("auth.login")}
        </Link>
      </div>
    </div>
  );
}
