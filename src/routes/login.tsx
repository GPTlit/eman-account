import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/eman";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { TranslationKey } from "@/i18n/translations";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Log in — EMAN" },
      { name: "description", content: "Log in to your EMAN business dashboard." },
      { property: "og:title", content: "Log in — EMAN" },
      { property: "og:description", content: "Access your shops, workers and transactions." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(t((friendlyError(error) ?? "common.error") as TranslationKey));
      return;
    }
    void navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl gradient-teal font-bold">إ</span>
            <span className="font-bold">{t("app.name")}</span>
          </Link>
          <LanguageSwitcher compact />
        </div>
        <div className="surface-card animate-rise p-6">
          <h1 className="text-2xl font-bold">{t("auth.welcome")}</h1>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t("common.loading") : t("auth.login")}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">
              {t("auth.forgot")}
            </Link>
            <Link to="/register" className="text-primary">
              {t("auth.register")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
