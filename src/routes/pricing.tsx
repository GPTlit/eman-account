import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PLANS, formatMoney, PAYMENT_NUMBER, SUPPORT_WHATSAPP } from "@/lib/eman";
import { PlanBadge } from "@/components/ui-kit";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — EMAN" },
      {
        name: "description",
        content: "EMAN yearly plans: Bronze 5,000, Silver 8,000, Gold 14,000 and Platinum 20,000 MRU.",
      },
      { property: "og:title", content: "Pricing — EMAN" },
      { property: "og:description", content: "Simple yearly plans for managing your shops with EMAN." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { t, locale } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl gradient-teal font-bold">إ</span>
          <span className="font-bold">{t("app.name")}</span>
        </Link>
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link to="/register">
            <Button size="sm">{t("auth.getStarted")}</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">{t("landing.pricing")}</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            </div>
          ))}
        </div>
        <div className="surface-card mt-8 p-6">
          <h2 className="font-semibold">{t("sub.payTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("sub.payHint")}</p>
          <p className="mt-3 text-sm">
            {t("sub.payNumber")}: <span className="font-semibold">{PAYMENT_NUMBER}</span>
          </p>
          <p className="text-sm">
            {t("sub.whatsapp")}: <span className="font-semibold">{SUPPORT_WHATSAPP}</span>
          </p>
        </div>
      </main>
    </div>
  );
}
