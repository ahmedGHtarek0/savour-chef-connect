import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chef/verify/payout")({
  component: VerifyPayout,
});

function VerifyPayout() {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ["chef_profile_verify", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("chef_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const [method, setMethod] = useState("");
  const [account, setAccount] = useState("");
  useEffect(() => {
    setMethod(profile.data?.payment_method ?? "");
    setAccount(profile.data?.payment_account ?? "");
  }, [profile.data]);

  async function save() {
    if (!user) return;
    if (!method || !account) return toast.error("Choose a method and add your account");
    const { error } = await supabase.from("chef_profiles").upsert({ user_id: user.id, payment_method: method, payment_account: account }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    toast.success("Saved"); profile.refetch();
  }

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Payout method</h2>
      <p className="text-sm text-muted-foreground">Where should we send your earnings?</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Payment gateway / method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="mt-2"><SelectValue placeholder="Choose a method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
              <SelectItem value="Orange Cash">Orange Cash</SelectItem>
              <SelectItem value="Etisalat Cash">Etisalat Cash</SelectItem>
              <SelectItem value="Instapay">Instapay</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="PayPal">PayPal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Account number / link</Label>
          <Input value={account} onChange={e => setAccount(e.target.value)} placeholder="Phone, IBAN, or PayPal link" className="mt-2" />
        </div>
      </div>
      <div className="flex justify-end"><Button onClick={save}>Save step</Button></div>
    </Card>
  );
}