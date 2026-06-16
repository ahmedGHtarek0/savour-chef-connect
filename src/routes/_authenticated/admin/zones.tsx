import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { GoogleMap, type ZoneMarker } from "@/components/GoogleMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/zones")({
  component: ZonesPage,
});

function ZonesPage() {
  const qc = useQueryClient();
  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["admin", "zones"],
    queryFn: async () => (await supabase.from("zones").select("*").order("name")).data ?? [],
  });
  const [name, setName] = useState("");
  const [lat, setLat] = useState("30.0444");
  const [lng, setLng] = useState("31.2357");
  const [radius, setRadius] = useState("5");

  const markers: ZoneMarker[] = zones.map(z => ({
    id: z.id, name: z.name, lat: Number(z.center_lat), lng: Number(z.center_lng), radiusKm: Number(z.radius_km),
  }));

  const add = async () => {
    if (!name) return toast.error("Name required");
    const { error } = await supabase.from("zones").insert({
      name, center_lat: Number(lat), center_lng: Number(lng), radius_km: Number(radius) || 5,
    });
    if (error) return toast.error(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: ["admin", "zones"] });
    toast.success("Zone added");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("zones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "zones"] });
  };

  return (
    <AdminShell title="Delivery zones">
      <p className="mb-4 text-sm text-muted-foreground">Click the map to drop a pin, then save as a new zone.</p>
      <GoogleMap markers={markers} onMapClick={(la, ln) => { setLat(la.toFixed(6)); setLng(ln.toFixed(6)); }} />
      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-background/60 p-4 sm:grid-cols-5">
        <Input placeholder="Zone name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Lat" value={lat} onChange={e => setLat(e.target.value)} />
        <Input placeholder="Lng" value={lng} onChange={e => setLng(e.target.value)} />
        <Input type="number" placeholder="Radius (km)" value={radius} onChange={e => setRadius(e.target.value)} />
        <Button onClick={add} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Add zone</Button>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="p-3">Name</th><th className="p-3">Center</th><th className="p-3">Radius</th><th className="p-3"></th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {zones.map(z => (
              <tr key={z.id} className="border-t border-border">
                <td className="p-3 font-medium">{z.name}</td>
                <td className="p-3 text-muted-foreground">{Number(z.center_lat).toFixed(3)}, {Number(z.center_lng).toFixed(3)}</td>
                <td className="p-3">{Number(z.radius_km)} km</td>
                <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => remove(z.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}