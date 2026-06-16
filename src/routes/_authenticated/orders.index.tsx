import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export const Route = createFileRoute("/_authenticated/orders/")({
  component: OrdersList,
});

function OrdersList() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my_orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, payment_status, placed_at")
        .order("placed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Your orders</h1>
        <div className="mt-6 space-y-3">
          {q.isLoading && Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
          {q.data?.map((o) => (
            <Link key={o.id} to="/orders/$orderId" params={{ orderId: o.id }} className="block rounded-xl border border-border bg-card/80 p-4 backdrop-blur hover:border-primary">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(o.placed_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{o.status}</Badge>
                  <Badge variant={o.payment_status === "verified" ? "default" : "secondary"}>{o.payment_status}</Badge>
                  <span className="text-lg font-semibold">{Number(o.total).toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
          {!q.isLoading && q.data?.length === 0 && (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="Browse home chefs near you and place your first order — it shows up here in real time."
              action={<Button asChild><Link to="/browse">Browse dishes</Link></Button>}
            />
          )}
        </div>
      </div>
    </div>
  );
}