import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { attachReceipt } from "@/lib/customer.functions";
import { toast } from "sonner";
import { CheckCircle2, ChefHat, Bike, PackageCheck, Clock, ShoppingBag } from "lucide-react";
import { ReviewForm } from "@/components/ReviewForm";

export const Route = createFileRoute("/_authenticated/orders/$orderId")({
  component: OrderDetail,
});

const STATUS_STEPS = [
  { key: "placed", label: "Placed", icon: ShoppingBag },
  { key: "awaiting_payment_verification", label: "Payment review", icon: Clock },
  { key: "chef_preparing", label: "Cooking", icon: ChefHat },
  { key: "ready_for_pickup", label: "Ready", icon: PackageCheck },
  { key: "picked_up", label: "Picked up", icon: Bike },
  { key: "on_the_way", label: "On the way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

function OrderDetail() {
  const { orderId } = Route.useParams();
  const attachReceiptFn = useServerFn(attachReceipt);
  const [uploading, setUploading] = useState(false);

  const q = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, items(name, photos)), customer_addresses(label, address), payment_gateways(name, account_number, instructions), payment_receipts(id, image_url, status), reviews(id, rating, comment)")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`order_${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => q.refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orderId]);

  async function uploadReceipt(file: File) {
    if (!q.data) return;
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const path = `${u.user.id}/${orderId}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("payment-receipts").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      await attachReceiptFn({ data: { orderId, imagePath: path, notes: null } });
      toast.success("Receipt uploaded. Pending verification.");
      q.refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (q.isLoading) return <div className="min-h-screen"><Navbar /><p className="container mx-auto py-20 text-center text-muted-foreground">Loading…</p></div>;
  if (!q.data) return <div className="min-h-screen"><Navbar /><p className="container mx-auto py-20 text-center">Order not found.</p></div>;

  const o: any = q.data;
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === o.status);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/orders">← All orders</Link></Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
            <h1 className="text-3xl font-bold tracking-tight">Order tracking</h1>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{o.status}</Badge>
            <Badge variant={o.payment_status === "verified" ? "default" : "secondary"}>{o.payment_status}</Badge>
          </div>
        </div>

        <Card className="mt-6 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Progress</h3>
          <div className="flex flex-wrap gap-3">
            {STATUS_STEPS.map((s, i) => {
              const active = i <= currentStepIdx;
              const Icon = s.icon;
              return (
                <div key={s.key} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" /> {s.label}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Items</h3>
            <div className="space-y-3">
              {o.order_items?.map((oi: any) => (
                <div key={oi.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                    {oi.items?.photos?.[0] && <img src={oi.items.photos[0]} className="h-full w-full object-cover" alt="" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{oi.items?.name}</p>
                    <p className="text-xs text-muted-foreground">×{oi.qty} • {oi.lead_time_hours}h prep</p>
                  </div>
                  <span className="font-semibold">{(Number(oi.unit_price) * oi.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {o.notes && <p className="mt-4 rounded-md bg-muted p-3 text-sm">📝 {o.notes}</p>}
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{Number(o.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{Number(o.delivery_fee).toFixed(2)}</span></div>
                <div className="my-2 border-t border-border" />
                <div className="flex justify-between font-semibold"><span>Total</span><span>{Number(o.total).toFixed(2)}</span></div>
              </div>
              {o.customer_addresses && (
                <div className="mt-4 border-t border-border pt-4 text-sm">
                  <p className="font-medium">{o.customer_addresses.label}</p>
                  <p className="text-muted-foreground">{o.customer_addresses.address}</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payment receipt</h3>
              {o.payment_gateways && (
                <div className="mb-3 rounded-md bg-muted/50 p-3 text-sm">
                  <p className="font-medium">{o.payment_gateways.name}</p>
                  {o.payment_gateways.account_number && <p className="text-muted-foreground">Pay to: {o.payment_gateways.account_number}</p>}
                  {o.payment_gateways.instructions && <p className="text-xs text-muted-foreground">{o.payment_gateways.instructions}</p>}
                </div>
              )}
              {o.payment_receipts?.length > 0 ? (
                <div className="space-y-2">
                  {o.payment_receipts.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                      <span className="truncate">Uploaded ✓</span>
                      <Badge variant="outline">{r.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadReceipt(f); }} />
                  <p className="mt-2 text-xs text-muted-foreground">Upload a screenshot of your transfer.</p>
                </div>
              )}
            </Card>

            {o.status === "delivered" && (
              <Card className="p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your review</h3>
                {o.reviews?.length ? (
                  <div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <CheckCircle2
                          key={i}
                          className={`h-5 w-5 ${i < o.reviews[0].rating ? "text-primary" : "text-muted-foreground/40"}`}
                        />
                      ))}
                    </div>
                    {o.reviews[0].comment && (
                      <p className="mt-2 text-sm text-muted-foreground">{o.reviews[0].comment}</p>
                    )}
                  </div>
                ) : (
                  <ReviewForm orderId={o.id} onSubmitted={() => q.refetch()} />
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}