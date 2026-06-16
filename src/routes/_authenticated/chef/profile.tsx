import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { submitChefForVerification } from "@/lib/chef.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chef/profile")({
  component: ChefProfile,
});

function ChefProfile() {
  const { user } = useAuth();
  const submitVerification = useServerFn(submitChefForVerification);

  const profile = useQuery({
    queryKey: ["chef_profile_full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("chef_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");

  useEffect(() => {
    if (!profile.data) return;
    setBio(profile.data.bio ?? "");
    setAddress(profile.data.address ?? "");
    setPaymentMethod(profile.data.payment_method ?? "");
    setPaymentAccount(profile.data.payment_account ?? "");
  }, [profile.data]);

  async function save() {
    if (!user) return;
    const payload = { user_id: user.id, bio, address, payment_method: paymentMethod, payment_account: paymentAccount };
    const { error } = await supabase.from("chef_profiles").upsert(payload, { onConflict: "user_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    profile.refetch();
  }

  async function submit() {
    try { await submitVerification(); toast.success("Submitted for review"); profile.refetch(); }
    catch (e: any) { toast.error(e.message); }
  }

  const status = profile.data?.verification_status ?? "unverified";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <Badge variant="outline" className="capitalize">{status}</Badge>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about your cooking style." className="mt-2" />
        </div>
        <div>
          <Label>Kitchen address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Payment method</Label>
            <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Vodafone Cash, Instapay…" className="mt-2" />
          </div>
          <div>
            <Label>Payment account</Label>
            <Input value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)} placeholder="Phone or IBAN" className="mt-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>Save</Button>
          {status !== "approved" && <Button variant="outline" onClick={submit} disabled={status === "pending"}>Submit for verification</Button>}
        </div>
        {status === "rejected" && profile.data?.rejection_reason && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">Rejected: {profile.data.rejection_reason}</p>
        )}
      </Card>
    </div>
  );
}