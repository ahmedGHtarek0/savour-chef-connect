import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, IdCard, MapPin, FileHeart, Wallet, Gauge, ChevronRight, Sparkles } from "lucide-react";

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
  const p = profile.data;
  const steps = [
    { key: "id", to: "/chef/verify/id", label: "Upload National ID (front & back) + AI check", icon: IdCard,
      done: !!(p?.id_front_url && p?.id_back_url && (p?.ai_id_check as any)?.is_id) },
    { key: "map", to: "/chef/verify/address", label: "Pin your kitchen address on the map", icon: MapPin,
      done: p?.lat != null && p?.lng != null },
    { key: "health", to: "/chef/verify/health", label: "Upload health certificate", icon: FileHeart,
      done: !!p?.health_cert_url },
    { key: "payout", to: "/chef/verify/payout", label: "Choose payout method & account", icon: Wallet,
      done: !!(p?.payment_method && p?.payment_account) },
    { key: "capacity", to: "/chef/verify/capacity", label: "Set your maximum orders per day", icon: Gauge,
      done: (p?.max_orders_per_day ?? 0) > 0 },
  ] as const;
  const completed = steps.filter(s => s.done).length;
  const isVerified = verification === "approved";
  const isPending = verification === "pending";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Kitchen</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome, chef</h1>
      </div>

      {!isVerified && (
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {isPending ? "Awaiting admin review" : "Get verified to start selling"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPending
                  ? "We'll notify you when an admin reviews your profile."
                  : `Complete ${steps.length} steps below — customers only see verified chefs.`}
              </p>
            </div>
            <Badge variant="outline">{completed}/{steps.length}</Badge>
          </div>
          <ol className="space-y-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.key}>
                  <Link
                    to={s.to}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition hover:border-primary ${s.done ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${s.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                        {s.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </span>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{s.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

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
        <Button asChild variant="outline" size="sm">
          <Link to={isVerified ? "/chef/insights" : "/chef/verify/id"}>
            {isVerified ? (<><Sparkles className="mr-1 h-4 w-4" /> AI insights</>) : "Continue verification"}
          </Link>
        </Button>
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