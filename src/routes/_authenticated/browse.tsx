import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ShoppingBag, ChefHat, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/browse")({
  component: BrowsePage,
});

function BrowsePage() {
  const [search, setSearch] = useState("");
  const [catId, setCatId] = useState<string | null>(null);
  const { add, count } = useCart();

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const feed = useQuery({
    queryKey: ["chef_items_feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_items")
        .select(
          "id, price, lead_time_hours, available, chef_id, items(id, name, description, photos, category_id), chef_profiles!chef_items_chef_id_fkey(user_id, bio, profiles(full_name, username))"
        )
        .eq("available", true)
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const rows = feed.data ?? [];
    return rows.filter((r: any) => {
      if (catId && r.items?.category_id !== catId) return false;
      if (search && !`${r.items?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [feed.data, catId, search]);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Discover</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">Home chefs near you</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Search dishes…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            <Button asChild variant="outline"><Link to="/cart"><ShoppingBag className="mr-2 h-4 w-4" />Cart ({count})</Link></Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant={catId === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setCatId(null)}>All</Badge>
          {cats.data?.map((c) => (
            <Badge key={c.id} variant={catId === c.id ? "default" : "outline"} className="cursor-pointer" onClick={() => setCatId(c.id)}>
              {c.name}
            </Badge>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row: any, i: number) => {
            const it = row.items;
            const chefName = row.chef_profiles?.profiles?.full_name ?? row.chef_profiles?.profiles?.username ?? "Home chef";
            const photo = it?.photos?.[0];
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur shadow-[var(--shadow-elegant)]"
              >
                <div className="aspect-[4/3] w-full bg-muted">
                  {photo ? (
                    <img src={photo} alt={it?.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ChefHat className="h-10 w-10" /></div>
                  )}
                </div>
                <div className="p-4">
                  <Link to="/items/$chefItemId" params={{ chefItemId: row.id }} className="font-semibold hover:underline">
                    {it?.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <ChefHat className="h-3 w-3" />
                    <Link to="/chefs/$chefId" params={{ chefId: row.chef_id }} className="hover:underline">{chefName}</Link>
                    <span>•</span>
                    <Clock className="h-3 w-3" /> {row.lead_time_hours}h prep
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{it?.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-semibold">{Number(row.price).toFixed(2)}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        add({
                          chefItemId: row.id,
                          itemId: it?.id,
                          chefId: row.chef_id,
                          chefName,
                          name: it?.name ?? "Item",
                          price: Number(row.price),
                          leadTimeHours: row.lead_time_hours,
                          photo: photo ?? null,
                        });
                        toast.success(`Added ${it?.name} to cart`);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {feed.isLoading && <p className="mt-10 text-center text-sm text-muted-foreground">Loading dishes…</p>}
        {!feed.isLoading && filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">No dishes match your filter yet.</p>
        )}
      </div>
    </div>
  );
}