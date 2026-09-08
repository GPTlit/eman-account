import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { EXPENSE_TYPES, INCOME_TYPES, PLAN_BY_ID, type PlanId } from "@/lib/eman";

export type Shop = Tables<"shops">;
export type Transaction = Tables<"transactions">;
export type Profile = Tables<"profiles">;
export type Subscription = Tables<"subscriptions">;

export async function notify(userId: string, titleKey: string, body?: string, link?: string) {
  await supabase.from("notifications").insert({ user_id: userId, title_key: titleKey, body, link });
}

export async function audit(
  actorId: string,
  action: string,
  objectType?: string,
  objectId?: string,
  details?: Record<string, unknown>,
) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    object_type: objectType ?? null,
    object_id: objectId ?? null,
    details: (details ?? null) as never,
  });
}

export async function fetchMyShops(userId: string, role: string): Promise<Shop[]> {
  if (role === "worker") {
    const { data, error } = await supabase
      .from("shop_members")
      .select("shop:shops(*)")
      .eq("worker_id", userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.shop).filter(Boolean) as Shop[];
  }
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type TxWithRefs = Transaction & {
  shop: { id: string; name: string } | null;
  creator: { id: string; full_name: string; username: string } | null;
};

export async function fetchTransactions(opts: {
  shopIds: string[];
  from?: Date | null;
  limit?: number;
}): Promise<TxWithRefs[]> {
  if (opts.shopIds.length === 0) return [];
  let query = supabase
    .from("transactions")
    .select("*, shop:shops(id,name), creator:profiles!transactions_created_by_fkey(id,full_name,username)")
    .in("shop_id", opts.shopIds)
    .order("occurred_at", { ascending: false });
  if (opts.from) query = query.gte("occurred_at", opts.from.toISOString());
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as TxWithRefs[];
}

export function summarise(transactions: Transaction[]) {
  const live = transactions.filter((t) => !t.is_voided);
  const sum = (pred: (t: Transaction) => boolean) =>
    live.filter(pred).reduce((acc, t) => acc + Number(t.total_amount ?? 0), 0);
  const income = sum((t) => INCOME_TYPES.includes(t.type as never));
  const expenses = sum((t) => EXPENSE_TYPES.includes(t.type as never));
  return {
    income,
    expenses,
    net: income - expenses,
    count: live.length,
    sales: sum((t) => t.type === "sale"),
    purchases: sum((t) => t.type === "purchase"),
    refunds: sum((t) => t.type === "refund"),
    debts: sum((t) => t.type === "debt"),
    received: sum((t) => t.type === "payment_received"),
    sent: sum((t) => t.type === "payment_sent"),
  };
}

export async function fetchSubscription(ownerId: string): Promise<Subscription | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "active")
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export function subscriptionIsValid(sub: Subscription | null) {
  if (!sub) return false;
  return sub.status === "active" && new Date(sub.ends_at).getTime() > Date.now();
}

export async function grantSubscription(
  adminId: string,
  ownerId: string,
  plan: PlanId,
  startsAt = new Date(),
) {
  const spec = PLAN_BY_ID[plan];
  const ends = new Date(startsAt);
  ends.setFullYear(ends.getFullYear() + 1);
  await supabase.from("subscriptions").update({ status: "cancelled" }).eq("owner_id", ownerId).eq("status", "active");
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      owner_id: ownerId,
      plan,
      status: "active",
      starts_at: startsAt.toISOString(),
      ends_at: ends.toISOString(),
      max_shops: spec.maxShops,
      max_workers: spec.maxWorkers,
    })
    .select()
    .single();
  if (error) throw error;
  await audit(adminId, "subscription_granted", "subscription", data.id, { plan, owner_id: ownerId });
  await notify(ownerId, "notif.subApproved");
  return data;
}
