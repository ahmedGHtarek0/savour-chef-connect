import { createFileRoute, Outlet, Link, useRouterState, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { submitChefForVerification } from "@/lib/chef.functions";
import { toast } from "sonner";
import { IdCard, MapPin, FileHeart, Wallet, Gauge, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef/verify")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/chef/verify") throw redirect({ to: "/chef/verify/id" });
  },
  component: VerifyLayout,
});

const STEPS = [
  { to: "/chef/verify/id", label: "National ID", icon: IdCard },
  { to: "/chef/verify/address", label: "Kitchen address", icon: MapPin },
  { to: "/chef/verify/health", label: "Health certificate", icon: FileHeart },
  { to: "/chef/verify/payout", label: "Payout method", icon: Wallet },
  { to: "/chef/verify/capacity", label: "Daily capacity", icon: Gauge },
] as const;

function VerifyLayout() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const submit = useServerFn(submitChefForVerification);
  const profile = useQuery({
    queryKey: ["chef_profile_verify", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("chef_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const p = profile.data;
  const done = {
    "/chef/verify/id": !!(p?.id_front_url && p?.id_back_url),
    "/chef/verify/address": p?.lat != null && p?.lng != null,
    "/chef/verify/health": !!p?.health_cert_url,
    "/chef/verify/payout": !!(p?.payment_method && p?.payment_account),
    "/chef/verify/capacity": (p?.max_orders_per_day ?? 0) > 0,
  } as Record<string, boolean>;
  const completed = Object.values(done).filter(Boolean).length;
  const allDone = completed === STEPS.length;
  const status = p?.verification_status ?? "not_submitted";

  async function onSubmit() {
    try { await submit(); toast.success("Submitted to admin for review"); profile.refetch(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/chef"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link></Button>
          <h1 className="text-2xl font-bold tracking-tight">Verification</h1>
        </div>
        <Badge variant="outline" className="capitalize">{status.replace("_", " ")}</Badge>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = pathname === s.to;
            const isDone = done[s.to];
            return (
              <Link key={s.to} to={s.to}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${active ? "border-primary bg-primary/5 font-medium" : isDone ? "border-emerald-500/40 bg-emerald-500/5" : "border-border"}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">{isDone ? "✓" : i + 1}</span>
                <Icon className="h-4 w-4" /> {s.label}
              </Link>
            );
          })}
        </div>
      </Card>

      <Outlet />

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm text-muted-foreground">{completed}/{STEPS.length} steps complete</div>
        <Button disabled={!allDone || status === "pending" || status === "approved"} onClick={onSubmit}>
          {status === "pending" ? "Awaiting admin review" : status === "approved" ? "Approved" : "Submit to admin"}
        </Button>
      </Card>

      {status === "rejected" && p?.rejection_reason && (
        <Card className="border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium">Admin rejected your submission</p>
          <p className="mt-1">{p.rejection_reason}</p>
        </Card>
      )}
    </div>
  );
}