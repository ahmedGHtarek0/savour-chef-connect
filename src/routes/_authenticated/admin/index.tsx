import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { FolderTree, UtensilsCrossed, Map, ChefHat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function useCount(table: "categories" | "items" | "zones" | "chef_profiles") {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });
}

function AdminHome() {
  const cats = useCount("categories");
  const items = useCount("items");
  const zones = useCount("zones");
  const chefs = useCount("chef_profiles");
  const stats = [
    { label: "Categories", value: cats.data, icon: FolderTree },
    { label: "Items in library", value: items.data, icon: UtensilsCrossed },
    { label: "Active zones", value: zones.data, icon: Map },
    { label: "Chef profiles", value: chefs.data, icon: ChefHat },
  ];
  return (
    <AdminShell title="Admin overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-background/60 p-5">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="text-3xl font-bold">{s.value ?? "—"}</div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}