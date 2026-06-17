import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { resolveZone, reverseGeocode } from "@/lib/chef-verify.functions";
import { GoogleMap } from "@/components/GoogleMap";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chef/verify/address")({
  component: VerifyAddress,
});

function VerifyAddress() {
  const { user } = useAuth();
  const lookupZone = useServerFn(resolveZone);
  const rev = useServerFn(reverseGeocode);
  const profile = useQuery({
    queryKey: ["chef_profile_verify", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("chef_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [zone, setZone] = useState<{ id: string; name: string; distance_km: number; inside: boolean } | null>(null);

  useEffect(() => {
    if (!profile.data) return;
    setAddress(profile.data.address ?? "");
    setDetails(profile.data.address_details ?? "");
    setLat(profile.data.lat ?? null);
    setLng(profile.data.lng ?? null);
  }, [profile.data]);

  async function pick(la: number, ln: number) {
    setLat(la); setLng(ln);
    try {
      const [{ zone: z }, { address: addr }] = await Promise.all([
        lookupZone({ data: { lat: la, lng: ln } }),
        rev({ data: { lat: la, lng: ln } }),
      ]);
      setZone(z);
      if (addr) setAddress(addr);
    } catch (e: any) { toast.error(e.message); }
  }

  async function save() {
    if (!user) return;
    if (lat == null || lng == null) return toast.error("Pin a location on the map");
    if (zone && !zone.inside) return toast.error("Outside delivery zones");
    const { error } = await supabase.from("chef_profiles").upsert({
      user_id: user.id, address, address_details: details, lat, lng,
      zone_id: zone?.inside ? zone.id : (profile.data?.zone_id ?? null),
    }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    toast.success("Saved");
    profile.refetch();
  }

  const pin = lat && lng ? [{ id: "self", name: "You", lat, lng, radiusKm: 0.2 }] : [];
  const center = lat && lng ? { lat, lng } : { lat: 30.0444, lng: 31.2357 };

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Kitchen address</h2>
      <div>
        <Label>Street address</Label>
        <Input value={address} onChange={e => setAddress(e.target.value)} className="mt-2" placeholder="Click the map and we'll fill this in" />
      </div>
      <div>
        <Label>Pin your location on the map</Label>
        <div className="mt-2 overflow-hidden rounded-lg border">
          <GoogleMap markers={pin} center={center} zoom={12} onMapClick={pick} />
        </div>
        {lat != null && lng != null && (
          <p className="mt-2 text-xs text-muted-foreground">
            Pinned at {lat.toFixed(4)}, {lng.toFixed(4)}
            {zone && <span className={`ml-2 ${zone.inside ? "text-emerald-600" : "text-destructive"}`}>{zone.inside ? `✓ inside ${zone.name}` : `✗ outside zones`}</span>}
          </p>
        )}
      </div>
      <div>
        <Label>Address details</Label>
        <Textarea value={details} onChange={e => setDetails(e.target.value)} className="mt-2" placeholder="Floor, apartment, landmark, gate code…" />
      </div>
      <div className="flex justify-end"><Button onClick={save}>Save step</Button></div>
    </Card>
  );
}