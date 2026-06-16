import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef/menu")({
  component: ChefMenu,
});

function ChefMenu() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Record<string, { price: string; lead: string }>>({});

  const items = useQuery({
    queryKey: ["lib_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("id, name, base_price, category_id, photos").eq("active", true).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const mine = useQuery({
    queryKey: ["chef_menu_mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("chef_items").select("*").eq("chef_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const myMap = new Map((mine.data ?? []).map((m) => [m.item_id, m]));

  async function addToMenu(itemId: string) {
    if (!user) return;
    const d = drafts[itemId] ?? { price: "", lead: "24" };
    const price = parseFloat(d.price);
    const lead = parseInt(d.lead || "24", 10);
    if (!Number.isFinite(price) || price <= 0) { toast.error("Enter a valid price"); return; }
    const { error } = await supabase.from("chef_items").insert({ chef_id: user.id, item_id: itemId, price, lead_time_hours: lead, available: true });
    if (error) { toast.error(error.message); return; }
    toast.success("Added to your menu");
    mine.refetch();
  }

  async function toggleAvail(id: string, available: boolean) {
    const { error } = await supabase.from("chef_items").update({ available }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    mine.refetch();
  }

  async function updatePrice(id: string, price: number, lead: number) {
    const { error } = await supabase.from("chef_items").update({ price, lead_time_hours: lead }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    mine.refetch();
  }

  async function removeFromMenu(id: string) {
    const { error } = await supabase.from("chef_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    mine.refetch();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Menu</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">My menu ({mine.data?.length ?? 0})</h2>
        <div className="grid gap-3">
          {mine.data?.map((m) => {
            const it = items.data?.find((i) => i.id === m.item_id);
            return (
              <Card key={m.id} className="flex flex-wrap items-center gap-4 p-3">
                <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                  {it?.photos?.[0] && <img src={it.photos[0]} className="h-full w-full object-cover" alt="" />}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="font-medium">{it?.name ?? "Item"}</p>
                </div>
                <Input type="number" defaultValue={m.price} className="w-24" onBlur={(e) => updatePrice(m.id, parseFloat(e.target.value), m.lead_time_hours)} />
                <Input type="number" defaultValue={m.lead_time_hours} className="w-20" onBlur={(e) => updatePrice(m.id, Number(m.price), parseInt(e.target.value || "24", 10))} title="Lead time (h)" />
                <div className="flex items-center gap-2"><Switch checked={m.available} onCheckedChange={(v) => toggleAvail(m.id, v)} /><Label className="text-xs">Live</Label></div>
                <Button variant="ghost" size="icon" onClick={() => removeFromMenu(m.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            );
          })}
          {mine.data?.length === 0 && <p className="text-sm text-muted-foreground">Pick from the library below to start your menu.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Library</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.data?.filter((i) => !myMap.has(i.id)).map((it) => {
            const d = drafts[it.id] ?? { price: String(it.base_price ?? ""), lead: "24" };
            return (
              <Card key={it.id} className="flex items-center gap-3 p-3">
                <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                  {it.photos?.[0] && <img src={it.photos[0]} className="h-full w-full object-cover" alt="" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">Base: {Number(it.base_price ?? 0).toFixed(2)}</p>
                </div>
                <Input type="number" placeholder="Price" className="w-24" value={d.price} onChange={(e) => setDrafts((s) => ({ ...s, [it.id]: { ...d, price: e.target.value } }))} />
                <Input type="number" placeholder="Hrs" className="w-20" value={d.lead} onChange={(e) => setDrafts((s) => ({ ...s, [it.id]: { ...d, lead: e.target.value } }))} />
                <Button size="sm" onClick={() => addToMenu(it.id)}><Plus className="h-4 w-4" /></Button>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}