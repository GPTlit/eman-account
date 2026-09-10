import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { useTheme } from "@/lib/theme";
import { LOCALES } from "@/i18n";
import { PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EMAN" },
      { name: "description", content: "Change your EMAN language, appearance and password." },
      { property: "og:title", content: "Settings — EMAN" },
      { property: "og:description", content: "Manage language, theme, security and privacy in EMAN." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      toast.error(t("auth.weakPassword"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password, current_password: current } as never);
    setBusy(false);
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    setPassword("");
    setCurrent("");
    toast.success(t("auth.passwordChanged"));
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings.title")} />

      <section className="surface-card p-6">
        <h2 className="mb-4 font-semibold">{t("theme.appearance")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["dark", "light"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              aria-pressed={theme === mode}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-start transition-colors",
                theme === mode ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
              )}
            >
              {mode === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <span className="font-medium">{t(mode === "dark" ? "theme.dark" : "theme.light")}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="mb-4 font-semibold">{t("common.language")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLocale(l.code)}
              aria-pressed={locale === l.code}
              className={cn(
                "rounded-xl border p-4 text-start transition-colors",
                locale === l.code ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
              )}
            >
              <span className="font-medium">{l.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="mb-4 font-semibold">{t("settings.security")}</h2>
        <form className="grid max-w-md gap-4" onSubmit={changePassword}>
          <div className="space-y-2">
            <Label htmlFor="current">{t("auth.password")}</Label>
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newpass">{t("auth.newPassword")}</Label>
            <Input
              id="newpass"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? t("common.saving") : t("auth.changePassword")}
          </Button>
        </form>
      </section>

      <section className="surface-card p-6">
        <h2 className="mb-2 font-semibold">{t("settings.privacy")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.privacyText")}</p>
      </section>

      <section className="surface-card p-6">
        <Button
          variant="destructive"
          onClick={async () => {
            await signOut();
            void navigate({ to: "/login", replace: true });
          }}
        >
          <LogOut className="size-4" />
          <span className="ms-2">{t("settings.signOut")}</span>
        </Button>
      </section>
    </div>
  );
}
