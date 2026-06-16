import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { advanceDelivery } from "@/lib/delivery.functions";
import { GoogleMap } from "@/components/GoogleMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Package, Truck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/delivery/active")({
  component: ActiveJobs,
});

const NEXT: Record<string, { label: string; next: "picked_up" | "on_the_way" | "delivered"; icon: any }> = {
  claimed: { label: "Mark picked up", next: "picked_up", icon: Package },
  picked_up: { label: "Start trip", next: "on_the_way", icon: Truck },
  on_the_way: { label: "Mark delivered", next: "delivered", icon: CheckCircle2 },
};

function ActiveJobs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const advance = useServerFn(advanceDelivery);

  const jobs = useQuery({
    queryKey: ["delivery_jobs_active", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("id, order_id, status, earnings, picked_at, delivered_at, orders(id, total, status, customer_addresses(label, address, lat, lng))")
        .eq("delivery_id", user!.id)
        .in("status", ["claimed", "picked_up", "on_the_way"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("delivery_jobs_active")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `delivery_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["delivery_jobs_active"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const advMut = useMutation({
    mutationFn: (v: { id: string; next: "picked_up" | "on_the_way" | "delivered" }) =>
      advance({ data: { deliveryId: v.id, status: v.next } }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["delivery_jobs_active"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const markers = (jobs.data ?? [])
    .map((j: any) => j.orders?.customer_addresses)
    .filter((a: any) => a?.lat && a?.lng)
    .map((a: any, i: number) => ({ id: String(i), name: a.label ?? "Drop-off", lat: a.lat, lng: a.lng, radiusKm: 0.3 }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Active jobs</h1>

      {markers.length > 0 && <GoogleMap markers={markers} />}

      {!jobs.data?.length ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No active jobs. Accept one from <span className="font-medium">Available jobs</span>.
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.data.map((j: any) => {
            const step = NEXT[j.status];
            const Icon = step?.icon;
            return (
              <Card key={j.id} className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary">Order #{String(j.order_id).slice(0, 8)}</Badge>
                    <p className="mt-2 flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      {j.orders?.customer_addresses?.label ?? "Drop-off"} — {j.orders?.customer_addresses?.address ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Current status: <span className="font-semibold capitalize">{String(j.status).replace(/_/g, " ")}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Earnings</p>
                    <p className="text-lg font-bold">EGP {Number(j.earnings ?? 0).toFixed(2)}</p>
                  </div>
                </div>
                {step && (
                  <Button className="w-full" disabled={advMut.isPending}
                    onClick={() => advMut.mutate({ id: j.id, next: step.next })}>
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {step.label}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}