import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMyShops, fetchSubscription, fetchTransactions } from "@/lib/api";

export function useMyShops() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["shops", profile?.id, profile?.role],
    enabled: Boolean(profile?.id),
    queryFn: () => fetchMyShops(profile!.id, profile!.role),
  });
}

export function useShopTransactions(shopIds: string[], from?: Date | null) {
  return useQuery({
    queryKey: ["transactions", shopIds.slice().sort(), from?.toISOString() ?? "all"],
    enabled: shopIds.length > 0,
    queryFn: () => fetchTransactions({ shopIds, from }),
  });
}

export function useSubscription() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["subscription", profile?.id],
    enabled: Boolean(profile?.id) && profile?.role !== "worker",
    queryFn: () => fetchSubscription(profile!.id),
  });
}

export function useMyWorkers() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["workers", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worker_requests")
        .select("*, worker:profiles!worker_requests_worker_id_fkey(*)")
        .eq("owner_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
