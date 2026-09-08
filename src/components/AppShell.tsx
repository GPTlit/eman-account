import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  LayoutDashboard,
  Store,
  Receipt,
  Users,
  BarChart3,
  CreditCard,
  User,
  Settings,
  Shield,
  LogOut,
  Menu,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n/translations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { StoredImage } from "@/components/StoredImage";

type NavItem = { to: string; labelKey: TranslationKey; icon: typeof Store };

const OWNER_NAV: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/shops", labelKey: "nav.shops", icon: Store },
  { to: "/transactions", labelKey: "nav.transactions", icon: Receipt },
  { to: "/workers", labelKey: "nav.workers", icon: Users },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { to: "/subscription", labelKey: "nav.subscription", icon: CreditCard },
  { to: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { to: "/profile", labelKey: "nav.profile", icon: User },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

const WORKER_NAV: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.myShop", icon: Store },
  { to: "/transactions", labelKey: "nav.transactions", icon: Receipt },
  { to: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { to: "/profile", labelKey: "nav.profile", icon: User },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = profile?.role === "owner" || isAdmin;
  const nav = isOwner ? OWNER_NAV : WORKER_NAV;
  const items = isAdmin
    ? [...nav, { to: "/admin", labelKey: "nav.admin" as TranslationKey, icon: Shield }]
    : nav;

  useEffect(() => {
    if (!profile?.id) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);
      setUnread(count ?? 0);
    };
    void fetchUnread();
    const channel = supabase
      .channel("notif-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        () => void fetchUnread(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{t(item.labelKey)}</span>
            {item.to === "/notifications" && unread > 0 && (
              <span className="ms-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const mobileItems = items.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 hidden w-64 flex-col border-e border-sidebar-border bg-sidebar p-4 lg:flex ltr:left-0 rtl:right-0">
        <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <span className="grid size-9 place-items-center rounded-xl gradient-teal font-bold">إ</span>
          <span className="text-lg font-bold">{t("app.name")}</span>
        </Link>
        <NavLinks />
        <div className="mt-auto space-y-2">
          <LanguageSwitcher />
          <Button variant="ghost" className="w-full justify-start" onClick={() => void handleSignOut()}>
            <LogOut className="size-4" />
            <span className="ms-2">{t("nav.logout")}</span>
          </Button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:ps-72">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("nav.more")}>
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="start" className="w-72 bg-sidebar p-4">
            <SheetTitle className="mb-4 text-lg font-bold">{t("app.name")}</SheetTitle>
            <NavLinks onNavigate={() => setMenuOpen(false)} />
            <div className="mt-6 space-y-2">
              <LanguageSwitcher />
              <Button variant="ghost" className="w-full justify-start" onClick={() => void handleSignOut()}>
                <LogOut className="size-4" />
                <span className="ms-2">{t("nav.logout")}</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <span className="font-semibold lg:hidden">{t("app.name")}</span>

        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link to="/notifications" className="relative" aria-label={t("nav.notifications")}>
            <Button variant="ghost" size="icon">
              <Bell className="size-5" />
            </Button>
            {unread > 0 && (
              <span className="absolute -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ltr:right-0 rtl:left-0">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link to="/profile" aria-label={t("nav.profile")}>
            <StoredImage
              path={profile?.avatar_url}
              alt={profile?.full_name ?? ""}
              className="size-9 rounded-full"
              fallback={<User className="size-4" />}
            />
          </Link>
        </div>
      </header>

      <main className="px-4 pb-28 pt-6 lg:ps-72 lg:pe-6 lg:pb-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/95 px-2 py-2 backdrop-blur lg:hidden"
        aria-label="Mobile"
      >
        {mobileItems.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Floating add-transaction button on mobile */}
      {pathname !== "/transactions/new" && (
        <Link
          to="/transactions/new"
          className="fixed bottom-20 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition-transform active:scale-95 lg:hidden ltr:right-5 rtl:left-5"
          aria-label={t("tx.add")}
        >
          <Plus className="size-6" />
        </Link>
      )}
    </div>
  );

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/login", replace: true });
  }
}
