import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n/translations";
import type { PlanId } from "@/lib/eman";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  featured,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-rise rounded-2xl border border-border p-5 transition-transform duration-300 hover:-translate-y-0.5",
        featured ? "gradient-teal shadow-[var(--shadow-card)]" : "surface-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-sm", featured ? "text-foreground/80" : "text-muted-foreground")}>{label}</p>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <p className={cn("mt-2 font-bold tracking-tight", featured ? "text-3xl sm:text-4xl" : "text-xl")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-muted-foreground">{title}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}

const PLAN_STYLES: Record<PlanId, string> = {
  bronze: "bg-[oklch(0.55_0.09_60)]/25 text-[oklch(0.82_0.11_65)] border-[oklch(0.65_0.1_60)]/40",
  silver: "bg-muted text-foreground/90 border-border",
  gold: "bg-warning/15 text-warning border-warning/40",
  platinum: "gradient-teal text-foreground border-border",
};

export function PlanBadge({ plan }: { plan: PlanId }) {
  const { t } = useI18n();
  const key = (`sub.${plan}` as TranslationKey);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        PLAN_STYLES[plan],
      )}
    >
      {t(key)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/40",
    approved: "bg-primary/15 text-primary border-primary/40",
    active: "bg-primary/15 text-primary border-primary/40",
    rejected: "bg-destructive/15 text-destructive border-destructive/40",
    cancelled: "bg-muted text-muted-foreground border-border",
    expired: "bg-destructive/10 text-destructive border-destructive/30",
  };
  const label = (`common.${status}` as TranslationKey);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {t(label)}
    </span>
  );
}
