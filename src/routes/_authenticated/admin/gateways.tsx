import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/gateways")({
  component: GatewaysPage,
});

function GatewaysPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "gateways"],
    queryFn: async () => (await supabase.from("payment_gateways").select("*").order("name")).data ?? [],
  });
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [instructions, setInstructions] = useState("");

  const add = async () => {
    if (!name) return toast.error("Name required");
    const { error } = await supabase.from("payment_gateways").insert({
      name, account_number: account || null, instructions: instructions || null,
    });
    if (error) return toast.error(error.message);
    setName(""); setAccount(""); setInstructions("");
    qc.invalidateQueries({ queryKey: ["admin", "gateways"] });
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("payment_gateways").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "gateways"] });
  };

  const remove = async (id: string) => {
    await supabase.from("payment_gateways").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "gateways"] });
  };

  return (
    <AdminShell title="Payment gateways">
      <p className="mb-4 text-sm text-muted-foreground">Manual gateways (Vodafone Cash, Instapay, bank transfer, etc.). Customers see active gateways at checkout.</p>
      <div className="grid gap-3 rounded-xl border border-border bg-background/60 p-4 sm:grid-cols-2">
        <Input placeholder="Gateway name (e.g. Vodafone Cash)" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Account number / handle" value={account} onChange={e => setAccount(e.target.value)} />
        <div className="sm:col-span-2"><Textarea placeholder="Customer instructions" value={instructions} onChange={e => setInstructions(e.target.value)} /></div>
        <div className="sm:col-span-2"><Button onClick={add} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Add gateway</Button></div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {isLoading && <div className="text-muted-foreground">Loading…</div>}
        {data.map(g => (
          <div key={g.id} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{g.name}</div>
                {g.account_number && <div className="text-sm text-muted-foreground">{g.account_number}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={g.active} onCheckedChange={() => toggle(g.id, g.active)} />
                <Button variant="ghost" size="icon" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            {g.instructions && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{g.instructions}</p>}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}