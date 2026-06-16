import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const subscribeMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { membershipId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: m, error: mErr } = await supabase
      .from("memberships")
      .select("id, duration_days, active")
      .eq("id", data.membershipId)
      .maybeSingle();
    if (mErr) throw mErr;
    if (!m || !m.active) throw new Error("Membership unavailable");
    const expires = new Date(Date.now() + m.duration_days * 86400000).toISOString();
    const { error: sErr } = await supabase.from("subscriptions").insert({
      user_id: userId,
      membership_id: m.id,
      started_at: new Date().toISOString(),
      expires_at: expires,
      active: true,
    });
    if (sErr) throw sErr;
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "membership",
      title: "Membership active",
      body: "Welcome aboard — enjoy your member perks.",
      data: { membership_id: m.id },
    });
    return { ok: true };
  });

export const createGroupOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const name = data.name.trim();
    if (!name) throw new Error("Name required");
    const { data: g, error } = await supabase
      .from("group_orders")
      .insert({ host_id: userId, name, status: "open" })
      .select("id")
      .single();
    if (error) throw error;
    await supabase.from("group_members").insert({ group_id: g.id, user_id: userId });
    return { groupId: g.id };
  });

export const joinGroupOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { groupId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: data.groupId, user_id: userId });
    if (error && !String(error.message).includes("duplicate")) throw error;
    return { ok: true };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
    return { ok: true };
  });