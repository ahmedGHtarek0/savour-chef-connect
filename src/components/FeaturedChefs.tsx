import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChefHat, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Chef = {
  chef_id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  address: string | null;
};

export function FeaturedChefs() {
  const [chefs, setChefs] = useState<Chef[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("public_chef_directory")
        .select("chef_id, full_name, username, bio, address")
        .limit(6);
      setChefs((data ?? []) as Chef[]);
    })();
  }, []);

  if (!chefs.length) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Featured</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">Meet our home chefs</h2>
        </div>
        <Link to="/auth" className="text-sm text-primary hover:underline">Browse all →</Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {chefs.map((c) => (
          <article
            key={c.chef_id}
            className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur transition hover:bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <ChefHat className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{c.full_name ?? c.username ?? "Home chef"}</h3>
                {c.address && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {c.address}
                  </p>
                )}
              </div>
            </div>
            {c.bio && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{c.bio}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}