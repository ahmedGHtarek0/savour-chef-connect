import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chef/payouts")({
  component: ChefPayouts,
});

function ChefPayouts() {
  const { user } = useAuth();

  const ledger = useQuery({
    queryKey: ["chef_ledger", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger")
        .select("*")
        .eq("party_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sign = (kind: string) => (kind === "chef_payout" || kind === "platform_cut" || kind === "refund" ? -1 : 1);
  const balance = (ledger.data ?? []).reduce((s, l: any) => s + Number(l.amount ?? 0) * sign(l.kind), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Available balance</p>
        <p className="mt-2 text-4xl font-bold">{balance.toFixed(2)}</p>
        <p className="mt-2 text-xs text-muted-foreground">Admin pays out per cycle. Manual transfer to your registered account.</p>
      </Card>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Type</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {ledger.data?.map((l: any) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-3">{new Date(l.created_at).toLocaleDateString()}</td>
                <td className="p-3 capitalize">{String(l.kind).replace(/_/g, " ")}</td>
                <td className={`p-3 text-right font-medium ${sign(l.kind) > 0 ? "text-green-500" : "text-destructive"}`}>{sign(l.kind) > 0 ? "+" : "−"}{Number(l.amount).toFixed(2)}</td>
                <td className="p-3 text-center"><Badge variant="outline">{l.status ?? "—"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {ledger.data?.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No ledger entries yet.</p>}
      </Card>
    </div>
  );
}