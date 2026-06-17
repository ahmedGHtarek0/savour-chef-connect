import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { updateOrderStatus } from "@/lib/chef.functions";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Phone, User, FileText, CreditCard, Truck, CheckCircle2, Circle, Clock, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef/orders/$orderId")({
  component: ChefOrderDetail,
});

const TIMELINE = [
  { key: "placed", label: "Order placed", icon: Circle },
  { key: "awaiting_payment_verification", label: "Payment review", icon: CreditCard },
  { key: "chef_preparing", label: "Preparing", icon: Clock },
  { key: "ready_for_pickup", label: "Ready for pickup", icon: CheckCircle2 },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

const ORDER: Record<string, number> = {
  placed: 0, awaiting_payment_verification: 1, chef_preparing: 2,
  ready_for_pickup: 3, out_for_delivery: 4, delivered: 5, cancelled: -1,
};

function ChefOrderDetail() {
  const { orderId } = useParams({ from: "/_authenticated/chef/orders/$orderId" });
  const { user } = useAuth();
  const update = useServerFn(updateOrderStatus);

  const q = useQuery({
    queryKey: ["chef_order_detail", orderId],
    enabled: !!user,
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, status, payment_status, total, placed_at, created_at, notes, customer_id, customer_addresses(label, address, phone)")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      const { data: lines } = await supabase
        .from("order_items")
        .select("qty, unit_price, lead_time_hours, items(name, photos)")
        .eq("order_id", orderId)
        .eq("chef_id", user!.id);
      const { data: customer } = order?.customer_id
        ? await supabase.from("profiles").select("full_name, phone, email").eq("id", order.customer_id).maybeSingle()
        : { data: null };
      return { order, lines: lines ?? [], customer };
    },
  });

  async function setStatus(status: any) {
    try { await update({ data: { orderId, status } }); toast.success("Updated"); q.refetch(); }
    catch (e: any) { toast.error(e.message); }
  }

  const o = q.data?.order;
  const lines = q.data?.lines ?? [];
  const customer = q.data?.customer;
  const subtotal = lines.reduce((s: number, l: any) => s + Number(l.unit_price) * Number(l.qty), 0);
  const currentStep = o ? (ORDER[o.status] ?? 0) : 0;
  const cancelled = o?.status === "cancelled";

  const nextAction = o?.status === "placed" || o?.status === "awaiting_payment_verification"
    ? { label: "Accept & start preparing", to: "chef_preparing" }
    : o?.status === "chef_preparing" ? { label: "Mark ready for pickup", to: "ready_for_pickup" }
    : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/chef/orders"><ArrowLeft className="h-4 w-4 mr-1" />Back to orders</Link></Button>

      {!o ? <Card className="p-8 text-center text-muted-foreground">Loading order…</Card> : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
              <h1 className="text-3xl font-bold tracking-tight">Order detail</h1>
              <p className="text-sm text-muted-foreground">Placed {new Date(o.placed_at ?? o.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={cancelled ? "destructive" : "outline"}>{o.status}</Badge>
              <Badge variant="secondary">{o.payment_status}</Badge>
            </div>
          </div>

          {/* Animated timeline */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h2>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
              <div className="absolute left-4 top-4 w-0.5 bg-primary transition-all duration-700" style={{ height: cancelled ? "0%" : `${(currentStep / (TIMELINE.length - 1)) * 100}%` }} />
              {TIMELINE.map((step, i) => {
                const done = !cancelled && i <= currentStep;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="relative flex items-center gap-3 py-2 pl-0">
                    <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-sm ${done ? "font-semibold" : "text-muted-foreground"}`}>{step.label}</span>
                  </div>
                );
              })}
              {cancelled && <p className="mt-3 text-sm font-semibold text-destructive">Order cancelled</p>}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"><FileText className="h-4 w-4" /> Items</h2>
              <div className="divide-y">
                {lines.map((l: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {l.items?.photos?.[0] && <img src={l.items.photos[0]} className="h-full w-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{l.items?.name}</p>
                      <p className="text-xs text-muted-foreground">Lead {l.lead_time_hours}h · {Number(l.unit_price).toFixed(2)} each</p>
                    </div>
                    <Badge variant="outline">× {l.qty}</Badge>
                    <span className="font-mono text-sm w-20 text-right">{(Number(l.unit_price) * Number(l.qty)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between font-semibold">
                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />Your subtotal</span>
                <span className="font-mono">{subtotal.toFixed(2)}</span>
              </div>
              {o.notes && <div className="mt-3 rounded bg-muted p-3 text-sm">📝 <strong>Customer note:</strong> {o.notes}</div>}
            </Card>

            <Card className="p-5 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Customer</h2>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{customer?.full_name ?? "Customer"}</p>
                {customer?.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{customer.phone}</p>}
                {o.customer_addresses && <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><span>{o.customer_addresses.label}<br /><span className="text-muted-foreground text-xs">{o.customer_addresses.address}</span></span></p>}
              </div>
              <div className="border-t pt-3 space-y-2">
                {nextAction && <Button className="w-full" onClick={() => setStatus(nextAction.to)}>{nextAction.label}</Button>}
                {!cancelled && o.status !== "delivered" && <Button variant="outline" className="w-full" onClick={() => setStatus("cancelled")}>Cancel order</Button>}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}