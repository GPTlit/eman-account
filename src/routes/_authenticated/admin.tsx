import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { useAuth } from "@/lib/auth";
import { grantSubscription, notify } from "@/lib/api";
import { formatDate, formatTime, type PlanId } from "@/lib/eman";
import { signedUrl } from "@/lib/storage";
import { PageHeader, PlanBadge, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — EMAN" },
      { name: "description", content: "EMAN administration: users, subscription requests and audit logs." },
      { property: "og:title", content: "Admin — EMAN" },
      { property: "og:description", content: "Review payments and manage EMAN subscriptions." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t, locale } = useI18n();
  const { isAdmin, profile } = useAuth();

  if (!isAdmin) {
    return <p className="surface-card p-6 text-center text-muted-foreground">{t("admin.denied")}</p>;
  }

  return (
    <div>
      <PageHeader title={t("admin.title")} />
      <Tabs defaultValue="requests">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="requests">{t("admin.requests")}</TabsTrigger>
          <TabsTrigger value="users">{t("admin.users")}</TabsTrigger>
          <TabsTrigger value="subs">{t("admin.activeSubs")}</TabsTrigger>
          <TabsTrigger value="audit">{t("admin.audit")}</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <Requests adminId={profile?.id ?? ""} />
        </TabsContent>
        <TabsContent value="users">
          <Users />
        </TabsContent>
        <TabsContent value="subs">
          <ActiveSubs adminId={profile?.id ?? ""} />
        </TabsContent>
        <TabsContent value="audit">
          <Audit />
        </TabsContent>
      </Tabs>
    </div>
  );

  function Requests({ adminId }: { adminId: string }) {
    const qc = useQueryClient();
    const [note, setNote] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
      queryKey: ["admin-requests"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("subscription_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data ?? [];
      },
    });

    async function decide(id: string, ownerId: string, plan: PlanId, approve: boolean) {
      setBusy(id);
      try {
        const { error } = await supabase
          .from("subscription_requests")
          .update({ status: approve ? "approved" : "rejected", admin_note: note[id] ?? null })
          .eq("id", id);
        if (error) throw error;
        if (approve) {
          await grantSubscription(adminId, ownerId, plan);
        } else {
          await notify(ownerId, "notif.subRejected", note[id]);
        }
        toast.success(approve ? t("admin.approvedDone") : t("admin.rejectedDone"));
        void qc.invalidateQueries({ queryKey: ["admin-requests"] });
        void qc.invalidateQueries({ queryKey: ["admin-subs"] });
      } catch {
        toast.error(t("common.error"));
      } finally {
        setBusy(null);
      }
    }

    if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
    if (!data || data.length === 0)
      return <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>;

    return (
      <ul className="space-y-3">
        {data.map((r) => (
          <li key={r.id} className="surface-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {r.full_name} <span className="text-muted-foreground">@{r.username}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(r.created_at, locale)} · {r.resident_area ?? "—"} · {r.whatsapp ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PlanBadge plan={r.plan as PlanId} />
                <StatusBadge status={r.status} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <DocLink path={r.id_document_path} label={t("admin.idDoc")} />
              <DocLink path={r.receipt_path} label={t("admin.receipt")} />
            </div>

            {r.status === "pending" && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Input
                  className="max-w-xs"
                  placeholder={t("admin.note")}
                  value={note[r.id] ?? ""}
                  onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  disabled={busy === r.id}
                  onClick={() => void decide(r.id, r.owner_id, r.plan as PlanId, true)}
                >
                  {t("common.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy === r.id}
                  onClick={() => void decide(r.id, r.owner_id, r.plan as PlanId, false)}
                >
                  {t("common.reject")}
                </Button>
              </div>
            )}
            {r.admin_note && r.status !== "pending" && (
              <p className="mt-2 text-xs text-muted-foreground">{r.admin_note}</p>
            )}
          </li>
        ))}
      </ul>
    );
  }

  function DocLink({ path, label }: { path: string | null; label: string }) {
    const [loading, setLoading] = useState(false);
    if (!path) return null;
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const url = await signedUrl(path);
          setLoading(false);
          if (url) window.open(url, "_blank", "noopener");
          else toast.error(t("common.error"));
        }}
      >
        {label}
      </Button>
    );
  }

  function Users() {
    const [term, setTerm] = useState("");
    const { data, isLoading } = useQuery({
      queryKey: ["admin-users"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, username, email, role, resident_area, created_at")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return data ?? [];
      },
    });

    const rows = (data ?? []).filter(
      (u) =>
        !term.trim() ||
        u.username.toLowerCase().includes(term.toLowerCase()) ||
        (u.full_name ?? "").toLowerCase().includes(term.toLowerCase()),
    );

    return (
      <div className="space-y-3">
        <Input
          className="max-w-sm"
          placeholder={t("admin.searchUser")}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((u) => (
              <li
                key={u.id}
                className="surface-card flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {u.full_name || "—"} <span className="text-muted-foreground">@{u.username}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.email ?? "—"} · {u.resident_area ?? "—"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t(
                    u.role === "admin"
                      ? "profile.role.admin"
                      : u.role === "owner"
                        ? "profile.role.owner"
                        : "profile.role.worker",
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  function ActiveSubs({ adminId }: { adminId: string }) {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({
      queryKey: ["admin-subs"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*, owner:profiles!subscriptions_owner_id_fkey(id, full_name, username)")
          .eq("status", "active")
          .order("ends_at", { ascending: true });
        if (error) throw error;
        return data ?? [];
      },
    });

    async function cancel(id: string, ownerId: string) {
      if (!window.confirm(t("admin.cancelConfirm"))) return;
      const { error } = await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", id);
      if (error) {
        toast.error(t("common.error"));
        return;
      }
      await supabase.from("audit_logs").insert({
        actor_id: adminId,
        action: "subscription_cancelled",
        object_type: "subscription",
        object_id: id,
      });
      await notify(ownerId, "notif.subRejected");
      toast.success(t("admin.cancelled"));
      void qc.invalidateQueries({ queryKey: ["admin-subs"] });
    }

    if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
    if (!data || data.length === 0)
      return <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>;

    return (
      <ul className="space-y-2">
        {data.map((s) => {
          const owner = s.owner as { full_name: string; username: string } | null;
          return (
            <li
              key={s.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {owner?.full_name || "—"}{" "}
                  <span className="text-muted-foreground">@{owner?.username}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("sub.activeUntil")}: {formatDate(s.ends_at, locale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PlanBadge plan={s.plan as PlanId} />
                <Button size="sm" variant="outline" onClick={() => void cancel(s.id, s.owner_id)}>
                  {t("admin.cancel")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  function Audit() {
    const { data, isLoading } = useQuery({
      queryKey: ["admin-audit"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*, actor:profiles!audit_logs_actor_id_fkey(username, full_name)")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return data ?? [];
      },
    });

    if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
    if (!data || data.length === 0)
      return <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>;

    return (
      <ul className="space-y-2">
        {data.map((a) => {
          const actor = a.actor as { username: string } | null;
          return (
            <li key={a.id} className="surface-card flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-medium">{a.action}</span>
              <span className="text-muted-foreground">
                @{actor?.username ?? "—"} · {a.object_type ?? "—"} · {formatDate(a.created_at, locale)}{" "}
                {formatTime(a.created_at, locale)}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
}
