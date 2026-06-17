import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Lock, ChefHat, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef/menu")({
  component: ChefMenu,
});

const UNIT_MODES = [
  { value: "count", label: "Count (pieces)" },
  { value: "weight_g", label: "Weight (grams)" },
  { value: "weight_kg", label: "Weight (kilograms)" },
];

function ChefMenu() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Record<string, { price: string; lead: string; unit: string; min: string; max: string }>>({});
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const cats = useQuery({
    queryKey: ["cats_lib"],
    queryFn: async () => (await supabase.from("categories").select("id, name").eq("active", true).order("name")).data ?? [],
  });

  const items = useQuery({
    queryKey: ["lib_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("id, name, description, recipe, ingredients, base_price, category_id, photos").eq("active", true).order("name");
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
    const it = items.data?.find((i) => i.id === itemId);
    const d = drafts[itemId] ?? { price: String(it?.base_price ?? ""), lead: "24", unit: "count", min: "1", max: "10" };
    const price = parseFloat(d.price);
    const lead = parseInt(d.lead || "24", 10);
    const min = parseFloat(d.min || "1");
    const max = parseFloat(d.max || "10");
    if (!Number.isFinite(price) || price <= 0) { toast.error("Enter a valid price"); return; }
    if (!(max > 0) || min < 0 || min > max) { toast.error("Min/Max must be valid (min ≤ max, max > 0)"); return; }
    const { error } = await supabase.from("chef_items").insert({
      chef_id: user.id, item_id: itemId, price, lead_time_hours: lead, available: true,
      unit_mode: d.unit, min_qty: min, max_qty: max,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Added to your menu");
    mine.refetch();
  }

  async function toggleAvail(id: string, available: boolean) {
    const { error } = await supabase.from("chef_items").update({ available }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    mine.refetch();
  }

  async function updateRow(id: string, patch: Record<string, any>) {
    const { error } = await supabase.from("chef_items").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    mine.refetch();
  }

  async function removeFromMenu(id: string) {
    const { error } = await supabase.from("chef_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    mine.refetch();
  }

  const filteredLib = (items.data ?? []).filter((i) => !myMap.has(i.id)).filter((i) =>
    (catFilter === "all" || i.category_id === catFilter) &&
    (search === "" || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <Lock className="inline h-3 w-3 mr-1" />Recipes, ingredients, and photos are managed by Savora admins. You set your <strong>price</strong>, <strong>quantity type</strong>, and <strong>min/max per order</strong>.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">My menu ({mine.data?.length ?? 0})</h2>
        <div className="grid gap-3">
          {mine.data?.map((m) => {
            const it = items.data?.find((i) => i.id === m.item_id);
            const isWeight = (m.unit_mode ?? "count").startsWith("weight");
            const unitLabel = m.unit_mode === "weight_g" ? "g" : m.unit_mode === "weight_kg" ? "kg" : "pcs";
            return (
              <Card key={m.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-md bg-muted shrink-0">
                    {it?.photos?.[0] ? <img src={it.photos[0]} className="h-full w-full object-cover" alt="" /> : <ChefHat className="h-full w-full p-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-semibold">{it?.name ?? "Item"}</p>
                    {it?.description && <p className="text-xs text-muted-foreground line-clamp-2">{it.description}</p>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{unitLabel}</Badge>
                      <Badge variant="outline" className="text-[10px]">{m.min_qty}–{m.max_qty} {unitLabel}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2"><Switch checked={m.available} onCheckedChange={(v) => toggleAvail(m.id, v)} /><Label className="text-xs">Live</Label></div>
                  <Button variant="ghost" size="icon" onClick={() => removeFromMenu(m.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-5">
                  <div><Label className="text-[10px]">Price</Label><Input type="number" defaultValue={m.price} onBlur={(e) => updateRow(m.id, { price: parseFloat(e.target.value) })} /></div>
                  <div><Label className="text-[10px]">Lead (h)</Label><Input type="number" defaultValue={m.lead_time_hours} onBlur={(e) => updateRow(m.id, { lead_time_hours: parseInt(e.target.value || "24", 10) })} /></div>
                  <div>
                    <Label className="text-[10px]">Unit type</Label>
                    <Select defaultValue={m.unit_mode ?? "count"} onValueChange={(v) => updateRow(m.id, { unit_mode: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{UNIT_MODES.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-[10px]">Min {isWeight ? "weight" : "qty"}</Label><Input type="number" defaultValue={m.min_qty ?? 1} onBlur={(e) => updateRow(m.id, { min_qty: parseFloat(e.target.value) })} /></div>
                  <div><Label className="text-[10px]">Max {isWeight ? "weight" : "qty"}</Label><Input type="number" defaultValue={m.max_qty ?? 10} onBlur={(e) => updateRow(m.id, { max_qty: parseFloat(e.target.value) })} /></div>
                </div>
                {(it?.ingredients?.length || it?.recipe) && (
                  <Accordion type="single" collapsible className="mt-2">
                    <AccordionItem value="d" className="border-none">
                      <AccordionTrigger className="py-1 text-xs">Recipe & ingredients (admin)</AccordionTrigger>
                      <AccordionContent>
                        {it.ingredients?.length > 0 && <div className="mb-2"><p className="text-[10px] uppercase text-muted-foreground">Ingredients</p><div className="flex flex-wrap gap-1 mt-1">{it.ingredients.map((g: string, i: number) => <Badge key={i} variant="secondary" className="text-[10px]">{g}</Badge>)}</div></div>}
                        {it.recipe && <div><p className="text-[10px] uppercase text-muted-foreground">Recipe</p><p className="text-xs mt-1 whitespace-pre-wrap">{it.recipe}</p></div>}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </Card>
            );
          })}
          {mine.data?.length === 0 && <p className="text-sm text-muted-foreground">Pick from the library below to start your menu.</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mr-auto">Admin catalog</h2>
          <div className="relative"><Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" /><Input placeholder="Search…" className="h-9 pl-7 w-48" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {cats.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredLib.map((it) => {
            const d = drafts[it.id] ?? { price: String(it.base_price ?? ""), lead: "24", unit: "count", min: "1", max: "10" };
            return (
              <Card key={it.id} className="p-3 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-md bg-muted shrink-0">
                    {it.photos?.[0] ? <img src={it.photos[0]} className="h-full w-full object-cover" alt="" /> : <ChefHat className="h-full w-full p-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">Base price: {Number(it.base_price ?? 0).toFixed(2)}</p>
                    {it.ingredients?.length > 0 && <p className="text-[10px] text-muted-foreground line-clamp-1">{it.ingredients.slice(0, 4).join(", ")}</p>}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1">
                  <Input type="number" placeholder="Price" value={d.price} onChange={(e) => setDrafts((s) => ({ ...s, [it.id]: { ...d, price: e.target.value } }))} />
                  <Input type="number" placeholder="Hrs" value={d.lead} onChange={(e) => setDrafts((s) => ({ ...s, [it.id]: { ...d, lead: e.target.value } }))} />
                  <Select value={d.unit} onValueChange={(v) => setDrafts((s) => ({ ...s, [it.id]: { ...d, unit: v } }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{UNIT_MODES.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="Min" value={d.min} onChange={(e) => setDrafts((s) => ({ ...s, [it.id]: { ...d, min: e.target.value } }))} />
                  <Input type="number" placeholder="Max" value={d.max} onChange={(e) => setDrafts((s) => ({ ...s, [it.id]: { ...d, max: e.target.value } }))} />
                </div>
                <Button size="sm" className="mt-2 w-full" onClick={() => addToMenu(it.id)}><Plus className="h-4 w-4 mr-1" />Add to my menu</Button>
              </Card>
            );
          })}
          {filteredLib.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-6">No items match your filters.</p>}
        </div>
      </section>
    </div>
  );
}