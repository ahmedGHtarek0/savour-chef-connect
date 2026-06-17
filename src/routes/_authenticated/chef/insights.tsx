import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { chefAiRecommendations } from "@/lib/chef-verify.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, Star, ShoppingBag, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chef/insights")({
  component: Insights,
});

function Insights() {
  const { user } = useAuth();
  const ai = useServerFn(chefAiRecommendations);
  const [recs, setRecs] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const stats = useQuery({
    queryKey: ["chef_insights_stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: items }, { data: oi }, { data: rv }] = await Promise.all([
        supabase.from("chef_items").select("id, available").eq("chef_id", user!.id),
        supabase.from("order_items").select("qty, unit_price, orders!inner(status, created_at)").eq("chef_id", user!.id).gte("orders.created_at", since),
        supabase.from("reviews").select("rating").eq("chef_id", user!.id),
      ]);
      const revenue = (oi ?? []).reduce((s: number, o: any) => s + Number(o.unit_price) * Number(o.qty), 0);
      const orderCount = (oi ?? []).length;
      const avg = rv && rv.length ? rv.reduce((s: number, r: any) => s + Number(r.rating), 0) / rv.length : null;
      return { menu: items?.length ?? 0, available: (items ?? []).filter((i: any) => i.available).length, revenue, orderCount, avg };
    },
  });

  async function generate() {
    setLoading(true);
    try { const r = await ai(); setRecs(r.recommendations); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  const s = stats.data;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights & AI coach</h1>
        <p className="text-sm text-muted-foreground">Advanced analytics for the last 30 days, plus personalized AI recommendations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><DollarSign className="h-3 w-3" /> Revenue 30d</p>
          <p className="mt-2 text-2xl font-bold">{(s?.revenue ?? 0).toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><ShoppingBag className="h-3 w-3" /> Orders 30d</p>
          <p className="mt-2 text-2xl font-bold">{s?.orderCount ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Star className="h-3 w-3" /> Avg rating</p>
          <p className="mt-2 text-2xl font-bold">{s?.avg ? s.avg.toFixed(2) : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><TrendingUp className="h-3 w-3" /> Menu live</p>
          <p className="mt-2 text-2xl font-bold">{s?.available ?? 0} / {s?.menu ?? 0}</p>
        </Card>
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">AI recommendations</h2></div>
          <Button onClick={generate} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate</Button>
        </div>
        {!recs && <p className="text-sm text-muted-foreground">Click Generate — our AI will analyze your menu, orders, and reviews and suggest concrete next steps.</p>}
        {recs && (
          <div className="grid gap-4 md:grid-cols-3">
            <Section title="Insights" items={recs.insights} tone="default" />
            <Section title="Action items" items={recs.actions} tone="primary" />
            <Section title="Menu ideas" items={recs.menu_ideas} tone="secondary" />
          </div>
        )}
      </Card>
    </div>
  );
}

function Section({ title, items, tone }: { title: string; items?: string[]; tone: "default" | "primary" | "secondary" }) {
  return (
    <div>
      <Badge variant={tone === "primary" ? "default" : "outline"} className="mb-3">{title}</Badge>
      <ul className="space-y-2 text-sm">
        {(items ?? []).map((it, i) => <li key={i} className="rounded-lg border p-3">{it}</li>)}
        {(!items || items.length === 0) && <li className="text-muted-foreground">No suggestions.</li>}
      </ul>
    </div>
  );
}