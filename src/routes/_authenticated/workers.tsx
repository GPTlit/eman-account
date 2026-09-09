import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/i18n";
import { useMyShops, useMyWorkers, useSubscription } from "@/hooks/useEman";
import { notify } from "@/lib/api";
import { EmptyState, ListSkeleton, PageHeader, StatusBadge } from "@/components/ui-kit";
import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/workers")({
  component: WorkersPage,
});

type WorkerProfile = { id: string; full_name: string; username: string; avatar_url: string | null };

function WorkersPage() {
  const { t } = useI18n();
  const { profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: requests, isLoading } = useMyWorkers();
  const { data: sub } = useSubscription();
  const [assignFor, setAssignFor] = useState<WorkerProfile | null>(null);

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const approved = (requests ?? []).filter((r) => r.status === "approved");
  const maxWorkers = sub?.max_workers ?? 0;

  async function decide(requestId: string, workerId: string, status: "approved" | "rejected") {
    if (status === "approved" && !isAdmin && approved.length >= maxWorkers) {
      toast.error(t("shops.limitReached"));
      return;
    }
    const { error } = await supabase.from("worker_requests").update({ status }).eq("id", requestId);
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    await notify(workerId, status === "approved" ? "notif.workerApproved" : "notif.workerRejected");
    toast.success(t(status === "approved" ? "workers.approved" : "workers.rejectedDone"));
    await qc.invalidateQueries({ queryKey: ["workers", profile?.id] });
  }

  return (
    <div>
      <PageHeader
        title={t("workers.title")}
        subtitle={sub ? `${approved.length} / ${maxWorkers}` : undefined}
      />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">{t("workers.pending")}</h2>
        {isLoading ? (
          <ListSkeleton rows={2} />
        ) : pending.length === 0 ? (
          <EmptyState title={t("admin.empty")} />
        ) : (
          <ul className="space-y-2">
            {pending.map((r) => {
              const worker = r.worker as WorkerProfile | null;
              return (
                <li key={r.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
                  <StoredImage
                    path={worker?.avatar_url}
                    alt={worker?.full_name ?? ""}
                    className="size-10 rounded-full"
                    fallback={<Users className="size-4" />}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{worker?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{worker?.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void decide(r.id, r.worker_id, "approved")}>
                      {t("common.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void decide(r.id, r.worker_id, "rejected")}
                    >
                      {t("common.reject")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("workers.activeWorkers")}</h2>
        {approved.length === 0 ? (
          <EmptyState title={t("workers.empty")} icon={<Users className="size-8" />} />
        ) : (
          <ul className="space-y-2">
            {approved.map((r) => {
              const worker = r.worker as WorkerProfile | null;
              return (
                <li key={r.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
                  <StoredImage
                    path={worker?.avatar_url}
                    alt={worker?.full_name ?? ""}
                    className="size-10 rounded-full"
                    fallback={<Users className="size-4" />}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{worker?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{worker?.username}</p>
                  </div>
                  <StatusBadge status="approved" />
                  <Button size="sm" variant="outline" onClick={() => worker && setAssignFor(worker)}>
                    {t("workers.assign")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void decide(r.id, r.worker_id, "rejected")}
                  >
                    {t("workers.remove")}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(assignFor)} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("workers.assignedShops")}</DialogTitle>
          </DialogHeader>
          {assignFor && <AssignShops worker={assignFor} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignShops({ worker }: { worker: WorkerProfile }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: shops } = useMyShops();

  const { data: memberships } = useQuery({
    queryKey: ["worker-shops", worker.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_members").select("*").eq("worker_id", worker.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function toggle(shopId: string, on: boolean) {
    if (on) {
      const { error } = await supabase.from("shop_members").insert({ shop_id: shopId, worker_id: worker.id });
      if (error) {
        toast.error(t("common.error"));
        return;
      }
      await notify(worker.id, "notif.shopAssigned");
    } else {
      const { error } = await supabase
        .from("shop_members")
        .delete()
        .eq("shop_id", shopId)
        .eq("worker_id", worker.id);
      if (error) {
        toast.error(t("common.error"));
        return;
      }
      await notify(worker.id, "notif.shopRemoved");
    }
    await qc.invalidateQueries({ queryKey: ["worker-shops", worker.id] });
    toast.success(t("common.save"));
  }

  return (
    <div className="space-y-2">
      {(shops ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t("shops.empty")}</p>}
      {(shops ?? []).map((shop) => {
        const on = (memberships ?? []).some((m) => m.shop_id === shop.id);
        return (
          <label key={shop.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <Checkbox checked={on} onCheckedChange={(v) => void toggle(shop.id, Boolean(v))} />
            <span className="flex-1">{shop.name}</span>
          </label>
        );
      })}
    </div>
  );
}
