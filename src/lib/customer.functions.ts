import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PlaceOrderInput = {
  addressId: string;
  gatewayId: string | null;
  notes: string | null;
  deliveryFee: number;
  lines: { chefItemId: string }[];
};

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: PlaceOrderInput) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.lines.length) throw new Error("Cart is empty");

    const ids = data.lines.map((l) => l.chefItemId);
    const { data: chefItems, error: ciErr } = await supabase
      .from("chef_items")
      .select("id, chef_id, item_id, price, lead_time_hours, available")
      .in("id", ids);
    if (ciErr) throw ciErr;
    if (!chefItems || chefItems.length !== ids.length) throw new Error("Some items are unavailable");
    for (const ci of chefItems) if (!ci.available) throw new Error("An item became unavailable");

    const qtyByCi = new Map<string, number>();
    for (const id of ids) qtyByCi.set(id, (qtyByCi.get(id) ?? 0) + 1);

    let subtotal = 0;
    const orderItems = chefItems.map((ci) => {
      const qty = qtyByCi.get(ci.id) ?? 1;
      subtotal += Number(ci.price) * qty;
      return {
        chef_id: ci.chef_id,
        chef_item_id: ci.id,
        item_id: ci.item_id,
        qty,
        unit_price: Number(ci.price),
        lead_time_hours: ci.lead_time_hours,
      };
    });

    const total = subtotal + Number(data.deliveryFee || 0);

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        customer_id: userId,
        address_id: data.addressId,
        payment_gateway_id: data.gatewayId,
        notes: data.notes,
        subtotal,
        delivery_fee: data.deliveryFee,
        discount: 0,
        total,
        status: "pending",
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (oErr) throw oErr;

    const { error: oiErr } = await supabase
      .from("order_items")
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));
    if (oiErr) throw oiErr;

    return { orderId: order.id };
  });

export const attachReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; imagePath: string; notes?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id, customer_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (oErr) throw oErr;
    if (!order || order.customer_id !== userId) throw new Error("Not authorized");

    const { error: rErr } = await supabase
      .from("payment_receipts")
      .insert({ order_id: data.orderId, image_url: data.imagePath, notes: data.notes ?? null, status: "pending" });
    if (rErr) throw rErr;

    await supabase.from("orders").update({ payment_status: "pending" }).eq("id", data.orderId);
    return { ok: true };
  });