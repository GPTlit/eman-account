import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Receipt, Store, Users } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PLANS, formatMoney } from "@/lib/eman";
import { PlanBadge } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EMAN — Your entire business. One place." },
      {
        name: "description",
        content:
          "EMAN is a business accounting platform for owners: manage multiple shops, workers, transactions and revenue from one dashboard.",
      },
      { property: "og:title", content: "EMAN — Your entire business. One place." },
      {
        property: "og:description",
        content: "Manage multiple shops, track transactions and supervise your workers with EMAN.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, locale } = useI18n();

  const features = [
    { icon: Store, title: t("landing.f1"), desc: t("landing.f1d") },
    { icon: Receipt, title: t("landing.f2"), desc: t("landing.f2d") },
    { icon: Users, title: t("landing.f3"), desc: t("landing.f3d") },
    { icon: BarChart3, title: t("landing.f4"), desc: t("landing.f4d") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5">
        <span className="grid size-9 place-items-center rounded-xl gradient-teal font-bold">إ</span>
        <span className="text-lg font-bold">{t("app.name")}</span>
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link to="/login">
            <Button variant="ghost" size="sm">
              {t("auth.login")}
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">{t("auth.getStarted")}</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-rise">
            <p className="mb-3 inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {t("app.name")} · MRU
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              <span className="text-gradient">{t("app.tagline")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-muted-foreground">{t("app.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg">
                  {t("auth.getStarted")}
                  <ArrowRight className="ms-2 size-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  {t("auth.login")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="animate-rise space-y-4">
            <div className="gradient-teal rounded-2xl border border-border p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm text-foreground/80">{t("dash.totalRevenue")}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight">{formatMoney(125400, locale)}</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { l: t("dash.income"), v: formatMoney(198000, locale) },
                  { l: t("dash.expenses"), v: formatMoney(72600, locale) },
                  { l: t("dash.txCount"), v: "412" },
                ].map((s) => (
                  <div key={s.l} className="glass rounded-xl p-3">
                    <p className="text-foreground/70">{s.l}</p>
                    <p className="mt-1 font-semibold">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {["Salem Electronics", "Salem Café"].map((name, i) => (
                <div key={name} className="surface-card p-4">
                  <p className="font-semibold">{name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("dash.net")}</p>
                  <p className="text-lg font-bold text-primary">
                    {formatMoney(i === 0 ? 74200 : 51200, locale)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-2xl font-bold sm:text-3xl">{t("landing.features")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="surface-card p-5">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-2xl font-bold sm:text-3xl">{t("landing.pricing")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.id} className="surface-card flex flex-col p-6">
              <PlanBadge plan={p.id} />
              <p className="mt-4 text-2xl font-bold">{formatMoney(p.price, locale)}</p>
              <p className="text-sm text-muted-foreground">{t("sub.perYear")}</p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                <li>
                  {p.maxShops} {t("sub.maxShops")}
                </li>
                <li>
                  {p.maxWorkers} {t("sub.maxWorkers")}
                </li>
              </ul>
              <Link to="/register" className="mt-6">
                <Button variant="outline" className="w-full">
                  {t("sub.choose")}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>{t("landing.cta")}</p>
        <p className="mt-2">© {new Date().getFullYear()} EMAN · إيمان</p>
      </footer>
    </div>
  );
}
