import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chef/verify/capacity")({
  component: VerifyCapacity,
});

function VerifyCapacity() {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ["chef_profile_verify", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("chef_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const [cap, setCap] = useState<number>(10);
  useEffect(() => { setCap(profile.data?.max_orders_per_day ?? 10); }, [profile.data]);

  async function save() {
    if (!user) return;
    if (!cap || cap < 1) return toast.error("Capacity must be at least 1");
    const { error } = await supabase.from("chef_profiles").upsert({ user_id: user.id, max_orders_per_day: cap }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    toast.success("Saved"); profile.refetch();
  }

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Maximum orders per day</h2>
      <p className="text-sm text-muted-foreground">
        If you set 10 here, customers can place at most 10 orders from you per day. The 11th will be rejected automatically.
      </p>
      <div className="max-w-xs">
        <Label>Daily order limit</Label>
        <Input type="number" min={1} max={500} value={cap} onChange={e => setCap(Number(e.target.value))} className="mt-2" />
      </div>
      <div className="flex justify-end"><Button onClick={save}>Save step</Button></div>
    </Card>
  );
}