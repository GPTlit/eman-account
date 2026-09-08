import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { friendlyError } from "@/lib/eman";
import { uploadTo } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account — EMAN" },
      {
        name: "description",
        content: "Register as a business owner (Al Batron) or as a worker and start using EMAN.",
      },
      { property: "og:title", content: "Create your account — EMAN" },
      { property: "og:description", content: "Register as an owner or worker on EMAN." },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,20}$/),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  whatsapp: z.string().trim().max(30).optional(),
  phone: z.string().trim().max(30).optional(),
  area: z.string().trim().max(120).optional(),
});

function RegisterPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [role, setRole] = useState<"owner" | "worker">("owner");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
    whatsapp: "",
    phone: "",
    area: "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (form.password !== form.confirm) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    const parsed = schema.safeParse({
      fullName: form.fullName,
      username: form.username,
      email: form.email,
      password: form.password,
      whatsapp: form.whatsapp,
      phone: form.phone,
      area: form.area,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      toast.error(
        issue?.path[0] === "username"
          ? t("auth.usernameRule")
          : issue?.path[0] === "password"
            ? t("auth.weakPassword")
            : issue?.path[0] === "email"
              ? t("auth.invalidEmail")
              : t("auth.required"),
      );
      return;
    }

    setBusy(true);

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", form.username.trim())
      .maybeSingle();
    if (existing) {
      setBusy(false);
      toast.error(t("auth.usernameTaken"));
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.fullName.trim(),
          username: form.username.trim(),
          whatsapp: form.whatsapp.trim(),
          phone: form.phone.trim(),
          resident_area: form.area.trim(),
          role,
          language: locale,
        },
      },
    });

    if (error) {
      setBusy(false);
      toast.error(t((friendlyError(error) ?? "common.error") as TranslationKey));
      return;
    }

    if (avatar && data.user) {
      try {
        const ref = await uploadTo("avatars", data.user.id, avatar);
        await supabase.from("profiles").update({ avatar_url: ref }).eq("id", data.user.id);
      } catch {
        toast.error(t("common.error"));
      }
    }

    setBusy(false);
    void navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl gradient-teal font-bold">إ</span>
            <span className="font-bold">{t("app.name")}</span>
          </Link>
          <LanguageSwitcher compact />
        </div>

        <div className="surface-card animate-rise p-6">
          <h1 className="text-2xl font-bold">{t("auth.createTitle")}</h1>

          <fieldset className="mt-6">
            <legend className="mb-2 text-sm text-muted-foreground">{t("auth.role")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["owner", "worker"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  aria-pressed={role === r}
                  className={cn(
                    "rounded-xl border p-4 text-start transition-colors",
                    role === r ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                  )}
                >
                  <span className="font-semibold">{t(r === "owner" ? "auth.owner" : "auth.worker")}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <Field id="fullName" label={t("auth.fullName")} value={form.fullName} onChange={set("fullName")} required />
            <Field
              id="username"
              label={t("auth.username")}
              value={form.username}
              onChange={set("username")}
              required
              hint={t("auth.usernameRule")}
            />
            <Field id="email" type="email" label={t("auth.email")} value={form.email} onChange={set("email")} required />
            <Field id="area" label={t("auth.area")} value={form.area} onChange={set("area")} />
            <Field id="whatsapp" label={t("auth.whatsapp")} value={form.whatsapp} onChange={set("whatsapp")} />
            <Field id="phone" label={t("auth.phone")} value={form.phone} onChange={set("phone")} />
            <Field
              id="password"
              type="password"
              label={t("auth.password")}
              value={form.password}
              onChange={set("password")}
              required
            />
            <Field
              id="confirm"
              type="password"
              label={t("auth.confirmPassword")}
              value={form.confirm}
              onChange={set("confirm")}
              required
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="avatar">
                {t("auth.picture")} <span className="text-muted-foreground">({t("common.optional")})</span>
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" className="sm:col-span-2" disabled={busy}>
              {busy ? t("common.loading") : t("auth.register")}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <Link to="/login" className="text-primary">
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
