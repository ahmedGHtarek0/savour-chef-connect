import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type OrderStatus =
  | "placed"
  | "awaiting_payment_verification"
  | "chef_preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; status: OrderStatus }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: oi, error: oiErr } = await context.supabase
      .from("order_items")
      .select("id")
      .eq("order_id", data.orderId)
      .eq("chef_id", userId)
      .limit(1);
    if (oiErr) throw oiErr;
    if (!oi || oi.length === 0) throw new Error("Not your order");

    const patch = data.status === "delivered"
      ? { status: data.status, delivered_at: new Date().toISOString() }
      : { status: data.status };
    const { error } = await supabase.from("orders").update(patch).eq("id", data.orderId);
    if (error) throw error;
    return { ok: true };
  });

export const submitChefForVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chef_profiles")
      .update({ verification_status: "pending", submitted_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });