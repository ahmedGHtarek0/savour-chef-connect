import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, MapPin, Plus, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServerFn } from "@tanstack/react-start";
import { placeOrder } from "@/lib/customer.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cart")({
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const placeOrderFn = useServerFn(placeOrder);

  const [addressId, setAddressId] = useState<string | null>(null);
  const [gatewayId, setGatewayId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddr, setNewAddr] = useState("");

  const addresses = useQuery({
    queryKey: ["addresses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      if (data?.length && !addressId) setAddressId(data[0].id);
      return data ?? [];
    },
  });

  const gateways = useQuery({
    queryKey: ["gateways"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_gateways").select("*").eq("active", true);
      if (error) throw error;
      if (data?.length && !gatewayId) setGatewayId(data[0].id);
      return data ?? [];
    },
  });

  const deliveryFee = 25;
  const total = subtotal + deliveryFee;

  async function addAddress() {
    if (!newLabel.trim() || !newAddr.trim() || !user) return;
    const { error } = await supabase.from("customer_addresses").insert({
      user_id: user.id,
      label: newLabel.trim(),
      address: newAddr.trim(),
      is_default: !(addresses.data?.length),
    });
    if (error) { toast.error(error.message); return; }
    setNewLabel(""); setNewAddr("");
    addresses.refetch();
  }

  async function checkout() {
    if (!addressId) { toast.error("Pick a delivery address"); return; }
    if (!lines.length) return;
    setSubmitting(true);
    try {
      const expanded = lines.flatMap((l) => Array.from({ length: l.qty }, () => ({ chefItemId: l.chefItemId })));
      const res = await placeOrderFn({ data: { addressId, gatewayId, notes: notes || null, deliveryFee, lines: expanded } });
      clear();
      toast.success("Order placed!");
      router.invalidate();
      navigate({ to: "/orders/$orderId", params: { orderId: res.orderId } });
    } catch (e: any) {
      toast.error(e.message ?? "Could not place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>

        {lines.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Button asChild><Link to="/browse">Browse dishes</Link></Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-3">
              {lines.map((l) => (
                <motion.div key={l.chefItemId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 rounded-xl border border-border bg-card/80 p-3 backdrop-blur">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
                    {l.photo ? <img src={l.photo} className="h-full w-full object-cover" alt="" /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.chefName} • {l.leadTimeHours}h prep</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setQty(l.chefItemId, l.qty - 1)}>−</Button>
                    <span className="w-6 text-center">{l.qty}</span>
                    <Button variant="ghost" size="sm" onClick={() => setQty(l.chefItemId, l.qty + 1)}>+</Button>
                  </div>
                  <div className="w-20 text-right font-semibold">{(l.price * l.qty).toFixed(2)}</div>
                  <Button variant="ghost" size="icon" onClick={() => remove(l.chefItemId)}><Trash2 className="h-4 w-4" /></Button>
                </motion.div>
              ))}

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Delivery address</h3>
                <div className="space-y-2">
                  {addresses.data?.map((a) => (
                    <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${addressId === a.id ? "border-primary bg-primary/5" : "border-border"}`}>
                      <input type="radio" name="addr" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium flex items-center gap-2"><MapPin className="h-3 w-3" /> {a.label}</p>
                        <p className="text-sm text-muted-foreground">{a.address}</p>
                      </div>
                    </label>
                  ))}
                  <div className="grid gap-2 rounded-md border border-dashed p-3">
                    <Label className="text-xs uppercase">Add new address</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Label (Home, Office…)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="w-48" />
                      <Input placeholder="Street, building, area" value={newAddr} onChange={(e) => setNewAddr(e.target.value)} />
                      <Button onClick={addAddress} variant="outline"><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payment</h3>
                <div className="space-y-2">
                  {gateways.data?.map((g) => (
                    <label key={g.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${gatewayId === g.id ? "border-primary bg-primary/5" : "border-border"}`}>
                      <input type="radio" name="gw" checked={gatewayId === g.id} onChange={() => setGatewayId(g.id)} className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">{g.name}</p>
                        {g.account_number && <p className="text-sm text-muted-foreground">Pay to: {g.account_number}</p>}
                        {g.instructions && <p className="text-xs text-muted-foreground">{g.instructions}</p>}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">After placing the order, upload your payment receipt from the order page.</p>
              </Card>

              <Card className="p-4">
                <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">Order notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, instructions…" className="mt-2" />
              </Card>
            </div>

            <Card className="h-fit p-6">
              <h3 className="text-lg font-semibold">Summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee.toFixed(2)}</span></div>
                <div className="my-2 border-t border-border" />
                <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{total.toFixed(2)}</span></div>
              </div>
              <Button onClick={checkout} disabled={submitting || !lines.length} className="mt-6 w-full">
                {submitting ? "Placing…" : "Place order"}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}