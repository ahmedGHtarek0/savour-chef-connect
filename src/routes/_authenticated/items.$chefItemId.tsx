import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, Clock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/items/$chefItemId")({
  component: ItemDetail,
});

function ItemDetail() {
  const { chefItemId } = Route.useParams();
  const { add } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);

  const q = useQuery({
    queryKey: ["chef_item", chefItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_items")
        .select("id, price, lead_time_hours, available, chef_id, items(id, name, description, ingredients, photos, recipe), chef_profiles!chef_items_chef_id_fkey(user_id, bio, profiles(full_name, username))")
        .eq("id", chefItemId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <div className="min-h-screen"><Navbar /><p className="container mx-auto py-20 text-center text-muted-foreground">Loading…</p></div>;
  if (!q.data) return <div className="min-h-screen"><Navbar /><p className="container mx-auto py-20 text-center">Item not found.</p></div>;

  const row: any = q.data;
  const it = row.items;
  const chefName = row.chef_profiles?.profiles?.full_name ?? row.chef_profiles?.profiles?.username ?? "Home chef";
  const photo = it?.photos?.[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/browse"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border bg-card/80 backdrop-blur">
            <div className="aspect-square w-full bg-muted">
              {photo ? <img src={photo} className="h-full w-full object-cover" alt={it?.name} /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ChefHat className="h-16 w-16" /></div>}
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{it?.name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <Link to="/chefs/$chefId" params={{ chefId: row.chef_id }} className="flex items-center gap-1 hover:underline"><ChefHat className="h-4 w-4" /> {chefName}</Link>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {row.lead_time_hours}h prep</span>
            </div>
            <p className="mt-4 text-muted-foreground">{it?.description}</p>

            {it?.ingredients?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ingredients</h3>
                <p className="mt-1 text-sm">{it.ingredients.join(", ")}</p>
              </div>
            )}

            <div className="mt-8 flex items-end gap-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Price</p>
                <p className="text-3xl font-bold">{Number(row.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
                <Button variant="ghost" size="sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</Button>
                <span className="w-6 text-center">{qty}</span>
                <Button variant="ghost" size="sm" onClick={() => setQty((q) => q + 1)}>+</Button>
              </div>
              <Button onClick={() => { add({ chefItemId: row.id, itemId: it?.id, chefId: row.chef_id, chefName, name: it?.name, price: Number(row.price), leadTimeHours: row.lead_time_hours, photo: photo ?? null }, qty); toast.success("Added to cart"); navigate({ to: "/cart" }); }}>Add to cart</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}