import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toggleOnline } from "@/lib/delivery.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/delivery/")({
  component: DeliveryOverview,
});

function DeliveryOverview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toggle = useServerFn(toggleOnline);

  const profile = useQuery({
    queryKey: ["delivery_profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("delivery_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const stats = useQuery({
    queryKey: ["delivery_stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count: available } = await supabase
        .from("deliveries").select("id", { count: "exact", head: true }).is("delivery_id", null);
      const { count: active } = await supabase
        .from("deliveries").select("id", { count: "exact", head: true })
        .eq("delivery_id", user!.id).in("status", ["claimed", "picked_up", "on_the_way"]);
      const { count: done } = await supabase
        .from("deliveries").select("id", { count: "exact", head: true })
        .eq("delivery_id", user!.id).eq("status", "delivered");
      return { available: available ?? 0, active: active ?? 0, done: done ?? 0 };
    },
  });

  const setOnline = useMutation({
    mutationFn: (online: boolean) => toggle({ data: { online } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["delivery_profile"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const v = profile.data?.verification_status ?? "not_submitted";
  const online = !!profile.data?.is_online;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Delivery</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome, driver</h1>
      </div>

      <Card className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          {v === "approved" ? <CheckCircle2 className="h-5 w-5 text-green-500" /> :
           v === "pending" ? <Clock className="h-5 w-5 text-amber-500" /> :
           <AlertCircle className="h-5 w-5 text-amber-500" />}
          <div>
            <p className="font-semibold">Verification: <Badge variant="outline" className="ml-1">{v}</Badge></p>
            <p className="text-xs text-muted-foreground">{v === "approved" ? "You can accept jobs." : "Submit your documents to start earning."}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Online</span>
          <Switch checked={online} disabled={v !== "approved" || setOnline.isPending}
            onCheckedChange={(c) => setOnline.mutate(c)} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/delivery/jobs">
          <Card className="p-5 transition-colors hover:border-primary">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Available now</p>
            <p className="mt-2 text-3xl font-bold">{stats.data?.available ?? "—"}</p>
          </Card>
        </Link>
        <Link to="/delivery/active">
          <Card className="p-5 transition-colors hover:border-primary">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Active jobs</p>
            <p className="mt-2 text-3xl font-bold">{stats.data?.active ?? "—"}</p>
          </Card>
        </Link>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total deliveries</p>
          <p className="mt-2 text-3xl font-bold">{stats.data?.done ?? "—"}</p>
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Lifetime earnings</p>
        <p className="mt-2 text-3xl font-bold">EGP {Number(profile.data?.total_earnings ?? 0).toFixed(2)}</p>
      </Card>
    </div>
  );
}