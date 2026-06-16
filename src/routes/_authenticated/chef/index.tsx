import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef/")({
  component: ChefOverview,
});

function ChefOverview() {
  const { user } = useAuth();

  const profile = useQuery({
    queryKey: ["chef_profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const stats = useQuery({
    queryKey: ["chef_stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count: menuCount } = await supabase
        .from("chef_items").select("id", { count: "exact", head: true }).eq("chef_id", user!.id);
      const { data: openOrders } = await supabase
        .from("order_items")
        .select("order_id, orders!inner(status)")
        .eq("chef_id", user!.id);
      const open = (openOrders ?? []).filter((o: any) => !["delivered", "cancelled"].includes(o.orders?.status));
      return { menu: menuCount ?? 0, open: open.length };
    },
  });

  const verification = profile.data?.verification_status ?? "unverified";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Kitchen</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome, chef</h1>
      </div>

      <Card className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          {verification === "approved" ? <CheckCircle2 className="h-5 w-5 text-green-500" /> :
           verification === "pending" ? <Clock className="h-5 w-5 text-amber-500" /> :
           <AlertCircle className="h-5 w-5 text-amber-500" />}
          <div>
            <p className="font-semibold">Verification: <Badge variant="outline" className="ml-1">{verification}</Badge></p>
            <p className="text-xs text-muted-foreground">{verification === "approved" ? "You're live in the marketplace." : "Customers see only verified chefs."}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/chef/profile">Manage profile</Link></Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/chef/menu">
          <Card className="p-5 transition-colors hover:border-primary">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Menu items</p>
            <p className="mt-2 text-3xl font-bold">{stats.data?.menu ?? "—"}</p>
          </Card>
        </Link>
        <Link to="/chef/orders">
          <Card className="p-5 transition-colors hover:border-primary">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Open orders</p>
            <p className="mt-2 text-3xl font-bold">{stats.data?.open ?? "—"}</p>
          </Card>
        </Link>
        <Link to="/chef/payouts">
          <Card className="p-5 transition-colors hover:border-primary">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
            <p className="mt-2 text-3xl font-bold capitalize">{verification}</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}