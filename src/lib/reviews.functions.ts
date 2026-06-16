import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; rating: number; comment?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.rating < 1 || data.rating > 5) throw new Error("Rating must be 1–5");

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id, status, customer_id, order_items(chef_id)")
      .eq("id", data.orderId)
      .maybeSingle();
    if (oErr) throw oErr;
    if (!order || order.customer_id !== userId) throw new Error("Not your order");
    if (order.status !== "delivered") throw new Error("Order must be delivered first");
    const chefId = order.order_items?.[0]?.chef_id;
    if (!chefId) throw new Error("No chef on order");

    const { error: rErr } = await supabase
      .from("reviews")
      .upsert(
        {
          order_id: data.orderId,
          chef_id: chefId,
          customer_id: userId,
          rating: data.rating,
          comment: data.comment ?? null,
        },
        { onConflict: "order_id" }
      );
    if (rErr) throw rErr;

    await supabase.from("notifications").insert({
      user_id: chefId,
      type: "review",
      title: "New review",
      body: `You received a ${data.rating}-star review.`,
      data: { order_id: data.orderId, rating: data.rating },
    });

    return { ok: true };
  });