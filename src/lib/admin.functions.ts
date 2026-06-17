import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Bootstrap-claim admin: if no admin exists in the system yet, grants the
 * calling user the admin role. Idempotent and safe to expose to authenticated
 * users — once any admin exists, this is a no-op for everyone else.
 */
export const claimAdminIfUnclaimed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw countErr;
    if ((count ?? 0) > 0) return { granted: false, reason: "admin_exists" as const };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw error;
    return { granted: true, userId: context.userId };
  });

export const verifyChef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chefId: string; status: "approved" | "rejected"; rejectionReason?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("chef_profiles")
      .update({
        verification_status: data.status,
        rejection_reason: data.status === "rejected" ? (data.rejectionReason ?? null) : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("user_id", data.chefId);
    if (error) throw error;
    await supabaseAdmin.from("notifications").insert({
      user_id: data.chefId,
      type: "verification",
      title: data.status === "approved" ? "You're verified!" : "Verification rejected",
      body:
        data.status === "approved"
          ? "Your chef profile is approved. You can start selling."
          : data.rejectionReason ?? "Please review and resubmit your documents.",
    });
    return { ok: true };
  });

export const verifyDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { driverId: string; status: "approved" | "rejected"; rejectionReason?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("delivery_profiles")
      .update({
        verification_status: data.status,
        rejection_reason: data.rejectionReason ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", data.driverId);
    if (error) throw error;
    await supabaseAdmin.from("notifications").insert({
      user_id: data.driverId,
      type: "verification",
      title: data.status === "approved" ? "You're verified!" : "Verification update",
      body:
        data.status === "approved"
          ? "Your driver profile is approved. You can start accepting jobs."
          : data.rejectionReason ?? "Please review and resubmit your documents.",
    });
    return { ok: true };
  });

export const reviewPaymentReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { receiptId: string; status: "verified" | "rejected"; notes?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: receipt, error: rErr } = await supabaseAdmin
      .from("payment_receipts")
      .select("id, order_id")
      .eq("id", data.receiptId)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!receipt) throw new Error("Receipt not found");

    const { error: uErr } = await supabaseAdmin
      .from("payment_receipts")
      .update({
        status: data.status,
        notes: data.notes ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.receiptId);
    if (uErr) throw uErr;

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("customer_id, status")
      .eq("id", receipt.order_id)
      .maybeSingle();

    if (data.status === "verified") {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "verified",
          ...(order?.status === "placed" || order?.status === "awaiting_payment_verification"
            ? { status: "chef_preparing" as const }
            : {}),
        })
        .eq("id", receipt.order_id);
    } else {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "rejected" })
        .eq("id", receipt.order_id);
    }

    if (order?.customer_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: order.customer_id,
        type: "payment",
        title: data.status === "verified" ? "Payment confirmed" : "Payment rejected",
        body:
          data.status === "verified"
            ? "Your payment was verified — the chef is preparing your order."
            : data.notes ?? "Please re-upload a valid receipt.",
        data: { order_id: receipt.order_id },
      });
    }

    return { ok: true };
  });