import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { formatDate, formatTime } from "@/lib/eman";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function markAll() {
    if (!profile) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
    await qc.invalidateQueries({ queryKey: ["notifications", profile.id] });
  }

  async function open(id: string, link: string | null, isRead: boolean) {
    if (!isRead) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      await qc.invalidateQueries({ queryKey: ["notifications", profile?.id] });
    }
    if (link) void navigate({ to: link });
  }

  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t("notif.title")}
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={() => void markAll()}>
              {t("notif.markRead")}
            </Button>
          ) : undefined
        }
      />
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState title={t("notif.empty")} icon={<Bell className="size-8" />} />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void open(n.id, n.link, n.is_read)}
                className={cn(
                  "surface-card w-full p-4 text-start transition-colors hover:bg-surface-2",
                  !n.is_read && "border-primary/40",
                )}
              >
                <div className="flex items-center gap-2">
                  {!n.is_read && <span className="size-2 rounded-full bg-primary" />}
                  <p className="font-medium">{t(n.title_key as TranslationKey)}</p>
                </div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(n.created_at, locale)} {formatTime(n.created_at, locale)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
