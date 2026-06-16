import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimDelivery } from "@/lib/delivery.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Inbox, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/delivery/jobs")({
  component: JobsInbox,
});

function JobsInbox() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const claim = useServerFn(claimDelivery);

  const jobs = useQuery({
    queryKey: ["delivery_jobs_available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("id, order_id, distance_km, earnings, created_at, orders!inner(id, total, delivery_fee, address_id, customer_addresses(address, label))")
        .is("delivery_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("delivery_jobs_inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => {
        qc.invalidateQueries({ queryKey: ["delivery_jobs_available"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const claimMut = useMutation({
    mutationFn: (id: string) => claim({ data: { deliveryId: id } }),
    onSuccess: () => {
      toast.success("Job claimed!");
      qc.invalidateQueries({ queryKey: ["delivery_jobs_available"] });
      navigate({ to: "/delivery/active" });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not claim"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Available jobs</h1>
      {jobs.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !jobs.data?.length ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" />
          <p>No available jobs right now. Stay online — new orders appear here in real time.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.data.map((j: any) => (
            <Card key={j.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary">Order #{String(j.order_id).slice(0, 8)}</Badge>
                  <p className="mt-2 flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    {j.orders?.customer_addresses?.label ?? "Delivery"} — {j.orders?.customer_addresses?.address ?? "Address hidden"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="text-lg font-bold">EGP {Number(j.earnings ?? j.orders?.delivery_fee ?? 0).toFixed(2)}</p>
                </div>
              </div>
              <Button className="w-full" disabled={claimMut.isPending} onClick={() => claimMut.mutate(j.id)}>
                {claimMut.isPending ? "Claiming…" : "Accept job"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}