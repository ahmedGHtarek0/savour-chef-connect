import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/items")({
  component: ItemsPage,
});

function ItemsPage() {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery({
    queryKey: ["categories-min"],
    queryFn: async () => (await supabase.from("categories").select("id,name").order("name")).data ?? [],
  });
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "items"],
    queryFn: async () => (await supabase.from("items").select("*, categories(name)").order("name")).data ?? [],
  });

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const add = async () => {
    if (!name || !categoryId) return toast.error("Name and category required");
    const { error } = await supabase.from("items").insert({
      name, category_id: categoryId, base_price: Number(price) || 0, description: description || null,
    });
    if (error) return toast.error(error.message);
    setName(""); setPrice(""); setDescription("");
    qc.invalidateQueries({ queryKey: ["admin", "items"] });
    toast.success("Item added to library");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "items"] });
  };

  return (
    <AdminShell title="Items library">
      <div className="grid gap-3 rounded-xl border border-border bg-background/60 p-4 sm:grid-cols-2">
        <Input placeholder="Item name" value={name} onChange={e => setName(e.target.value)} />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="number" placeholder="Base price" value={price} onChange={e => setPrice(e.target.value)} />
        <div className="sm:col-span-2"><Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} /></div>
        <div className="sm:col-span-2"><Button onClick={add} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Add item</Button></div>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Base price</th><th className="p-3"></th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {items.map((it: any) => (
              <tr key={it.id} className="border-t border-border">
                <td className="p-3 font-medium">{it.name}</td>
                <td className="p-3 text-muted-foreground">{it.categories?.name ?? "—"}</td>
                <td className="p-3">{Number(it.base_price).toFixed(2)}</td>
                <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}