import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type DeliveryStatus = "available" | "claimed" | "picked_up" | "on_the_way" | "delivered";

export const claimDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deliveryId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("deliveries")
      .update({ delivery_id: userId, status: "claimed" })
      .eq("id", data.deliveryId)
      .is("delivery_id", null)
      .select("id, order_id")
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Job no longer available");
    return row;
  });

export const advanceDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deliveryId: string; status: DeliveryStatus }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "picked_up") patch.picked_at = new Date().toISOString();
    if (data.status === "delivered") patch.delivered_at = new Date().toISOString();

    const { data: del, error } = await supabase
      .from("deliveries")
      .update(patch)
      .eq("id", data.deliveryId)
      .eq("delivery_id", userId)
      .select("order_id")
      .maybeSingle();
    if (error) throw error;
    if (!del) throw new Error("Not your job");

    const orderPatch =
      data.status === "picked_up"
        ? { status: "picked_up" as const }
        : data.status === "on_the_way"
          ? { status: "on_the_way" as const }
          : data.status === "delivered"
            ? { status: "delivered" as const, delivered_at: new Date().toISOString() }
            : null;
    if (orderPatch) {
      await supabase.from("orders").update(orderPatch).eq("id", del.order_id);
    }
    return { ok: true };
  });

export const toggleOnline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { online: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("delivery_profiles")
      .upsert({ user_id: userId, is_online: data.online }, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });

export const submitDeliveryForVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("delivery_profiles")
      .update({ verification_status: "pending", submitted_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });