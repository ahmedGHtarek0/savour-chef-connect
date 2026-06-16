import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { updateOrderStatus } from "@/lib/chef.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chef/orders")({
  component: ChefOrders,
});

const FLOW = [
  { from: ["placed", "awaiting_payment_verification"], to: "chef_preparing" as const, label: "Accept & start" },
  { from: ["chef_preparing"], to: "ready_for_pickup" as const, label: "Mark ready" },
] as const;

function ChefOrders() {
  const { user } = useAuth();
  const update = useServerFn(updateOrderStatus);

  const q = useQuery({
    queryKey: ["chef_orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, qty, lead_time_hours, items(name), orders!inner(id, status, payment_status, total, placed_at, notes, customer_addresses(label, address))")
        .eq("chef_id", user!.id)
        .order("created_at", { foreignTable: "orders", ascending: false } as any);
      if (error) throw error;
      const byOrder = new Map<string, any>();
      for (const row of data ?? []) {
        const o = (row as any).orders;
        const key = o.id;
        if (!byOrder.has(key)) byOrder.set(key, { ...o, lines: [] });
        byOrder.get(key).lines.push({ name: (row as any).items?.name, qty: (row as any).qty, lead: (row as any).lead_time_hours });
      }
      return Array.from(byOrder.values());
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("chef_orders_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => q.refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function setStatus(orderId: string, status: "chef_preparing" | "ready_for_pickup" | "cancelled" | "delivered") {
    try {
      await update({ data: { orderId, status } });
      toast.success("Order updated");
      q.refetch();
    } catch (e: any) { toast.error(e.message); }
  }

  const open = (q.data ?? []).filter((o: any) => !["delivered", "cancelled"].includes(o.status));
  const past = (q.data ?? []).filter((o: any) => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Incoming orders</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Open ({open.length})</h2>
        {open.map((o: any) => {
          const next = FLOW.find((f) => f.from.includes(o.status));
          return (
            <Card key={o.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.placed_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{o.status}</Badge>
                  <Badge variant="secondary">{o.payment_status}</Badge>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.lines.map((l: any, i: number) => (
                  <li key={i}>× {l.qty} {l.name} <span className="text-muted-foreground">({l.lead}h)</span></li>
                ))}
              </ul>
              {o.customer_addresses && <p className="mt-2 text-xs text-muted-foreground">Deliver to {o.customer_addresses.label}: {o.customer_addresses.address}</p>}
              {o.notes && <p className="mt-1 rounded bg-muted p-2 text-xs">📝 {o.notes}</p>}
              <div className="mt-3 flex gap-2">
                {next && <Button size="sm" onClick={() => setStatus(o.id, next.to)}>{next.label}</Button>}
                <Button size="sm" variant="outline" onClick={() => setStatus(o.id, "cancelled")}>Cancel</Button>
              </div>
            </Card>
          );
        })}
        {open.length === 0 && <p className="text-sm text-muted-foreground">No open orders right now.</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Past ({past.length})</h2>
        {past.slice(0, 20).map((o: any) => (
          <Card key={o.id} className="flex items-center justify-between p-3 text-sm">
            <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>
            <Badge variant="outline">{o.status}</Badge>
            <span>{Number(o.total).toFixed(2)}</span>
          </Card>
        ))}
      </section>
    </div>
  );
}