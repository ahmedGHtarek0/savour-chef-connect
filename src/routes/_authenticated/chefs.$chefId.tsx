import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, Clock, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chefs/$chefId")({
  component: ChefPage,
});

function ChefPage() {
  const { chefId } = Route.useParams();
  const { add } = useCart();

  const chef = useQuery({
    queryKey: ["chef", chefId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_profiles")
        .select("user_id, bio, address, profiles(full_name, username, avatar_url)")
        .eq("user_id", chefId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const menu = useQuery({
    queryKey: ["chef_menu", chefId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_items")
        .select("id, price, lead_time_hours, available, items(id, name, description, photos)")
        .eq("chef_id", chefId)
        .eq("available", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const chefName = (chef.data as any)?.profiles?.full_name ?? (chef.data as any)?.profiles?.username ?? "Home chef";

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-3xl border border-border bg-card/80 p-8 backdrop-blur shadow-[var(--shadow-elegant)]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <ChefHat className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{chefName}</h1>
              {chef.data?.address && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" /> {chef.data.address}</p>
              )}
            </div>
          </div>
          {chef.data?.bio && <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{chef.data.bio}</p>}
        </div>

        <h2 className="mt-10 text-xl font-semibold">Menu</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {menu.data?.map((row: any) => {
            const photo = row.items?.photos?.[0];
            return (
              <div key={row.id} className="overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur">
                <div className="aspect-[4/3] w-full bg-muted">
                  {photo ? <img src={photo} className="h-full w-full object-cover" alt={row.items?.name} /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ChefHat className="h-10 w-10" /></div>}
                </div>
                <div className="p-4">
                  <Link to="/items/$chefItemId" params={{ chefItemId: row.id }} className="font-semibold hover:underline">{row.items?.name}</Link>
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {row.lead_time_hours}h prep</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-semibold">{Number(row.price).toFixed(2)}</span>
                    <Button size="sm" onClick={() => { add({ chefItemId: row.id, itemId: row.items?.id, chefId, chefName, name: row.items?.name ?? "Item", price: Number(row.price), leadTimeHours: row.lead_time_hours, photo: photo ?? null }); toast.success("Added to cart"); }}>Add</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}