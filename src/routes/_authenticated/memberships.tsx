import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { subscribeMembership } from "@/lib/loyalty.functions";

export const Route = createFileRoute("/_authenticated/memberships")({
  component: MembershipsPage,
});

function MembershipsPage() {
  const qc = useQueryClient();
  const subscribe = useServerFn(subscribeMembership);
  const [busy, setBusy] = useState<string | null>(null);

  const plans = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("id, name, description, price, duration_days, benefits, active")
        .eq("active", true)
        .order("price", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const mySubs = useQuery({
    queryKey: ["my-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, membership_id, expires_at, active")
        .eq("active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeIds = new Set((mySubs.data ?? []).map((s) => s.membership_id));

  const onSubscribe = async (id: string) => {
    setBusy(id);
    try {
      await subscribe({ data: { membershipId: id } });
      toast.success("You're a member!");
      qc.invalidateQueries({ queryKey: ["my-subs"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to subscribe");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Membership plans</h1>
          <p className="mt-2 text-muted-foreground">Unlock free delivery, exclusive dishes, and chef priority.</p>
        </div>

        {plans.isLoading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : (plans.data ?? []).length === 0 ? (
          <p className="text-center text-muted-foreground">No plans available yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {(plans.data ?? []).map((p, i) => {
              const benefits = Array.isArray(p.benefits) ? (p.benefits as string[]) : [];
              const active = activeIds.has(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col rounded-2xl border border-border bg-card/80 p-6 backdrop-blur shadow-[var(--shadow-elegant)]"
                >
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${Number(p.price).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">/ {p.duration_days}d</span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2 text-sm">
                    {benefits.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{String(b)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6"
                    disabled={active || busy === p.id}
                    onClick={() => onSubscribe(p.id)}
                  >
                    {active ? "Active" : busy === p.id ? "Subscribing…" : "Subscribe"}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}