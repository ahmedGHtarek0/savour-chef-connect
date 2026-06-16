import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { submitChefForVerification } from "@/lib/chef.functions";
import { aiIdCheck, resolveZone } from "@/lib/chef-verify.functions";
import { GoogleMap } from "@/components/GoogleMap";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef/profile")({
  component: ChefProfile,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ChefProfile() {
  const { user } = useAuth();
  const submitVerification = useServerFn(submitChefForVerification);
  const runIdCheck = useServerFn(aiIdCheck);
  const lookupZone = useServerFn(resolveZone);

  const profile = useQuery({
    queryKey: ["chef_profile_full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("chef_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [zoneInfo, setZoneInfo] = useState<{ id: string; name: string; distance_km: number; inside: boolean } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [healthUrl, setHealthUrl] = useState<string | null>(null);
  const [aiCheck, setAiCheck] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.data) return;
    setBio(profile.data.bio ?? "");
    setAddress(profile.data.address ?? "");
    setAddressDetails(profile.data.address_details ?? "");
    setLat(profile.data.lat ?? null);
    setLng(profile.data.lng ?? null);
    setPaymentMethod(profile.data.payment_method ?? "");
    setPaymentAccount(profile.data.payment_account ?? "");
    setIdFrontUrl(profile.data.id_front_url ?? null);
    setIdBackUrl(profile.data.id_back_url ?? null);
    setHealthUrl(profile.data.health_cert_url ?? null);
    setAiCheck(profile.data.ai_id_check ?? null);
  }, [profile.data]);

  async function uploadFile(field: "id_front" | "id_back" | "health", file: File) {
    if (!user) return null;
    setBusy(field);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chef-docs").upload(path, file, { upsert: true });
    if (error) { setBusy(null); toast.error(error.message); return null; }
    setBusy(null);
    toast.success("Uploaded");
    return path;
  }

  async function onUploadIdFront(file: File) {
    const p = await uploadFile("id_front", file);
    if (p) setIdFrontUrl(p);
  }
  async function onUploadIdBack(file: File) {
    const p = await uploadFile("id_back", file);
    if (p) setIdBackUrl(p);
  }
  async function onUploadHealth(file: File) {
    const p = await uploadFile("health", file);
    if (p) setHealthUrl(p);
  }

  async function runOcr() {
    if (!user || !idFrontUrl) return toast.error("Upload ID front first");
    setBusy("ocr");
    try {
      const front = await supabase.storage.from("chef-docs").createSignedUrl(idFrontUrl, 60);
      const frontUrl = front.data?.signedUrl;
      if (!frontUrl) throw new Error("Could not read uploaded file");
      const frontBlob = await (await fetch(frontUrl)).blob();
      const frontData = await fileToDataUrl(new File([frontBlob], "front"));
      let backData: string | undefined;
      if (idBackUrl) {
        const back = await supabase.storage.from("chef-docs").createSignedUrl(idBackUrl, 60);
        if (back.data?.signedUrl) {
          const b = await (await fetch(back.data.signedUrl)).blob();
          backData = await fileToDataUrl(new File([b], "back"));
        }
      }
      const { result } = await runIdCheck({ data: { frontDataUrl: frontData, backDataUrl: backData } });
      setAiCheck(result);
      toast.success(result?.is_id ? "Looks like a valid ID" : "Could not confirm ID — best effort only");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function pickOnMap(la: number, ln: number) {
    setLat(la);
    setLng(ln);
    try {
      const { zone } = await lookupZone({ data: { lat: la, lng: ln } });
      setZoneInfo(zone);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function save() {
    if (!user) return;
    const payload: any = {
      user_id: user.id, bio, address, address_details: addressDetails,
      lat, lng,
      zone_id: zoneInfo?.inside ? zoneInfo.id : (profile.data?.zone_id ?? null),
      payment_method: paymentMethod, payment_account: paymentAccount,
      id_front_url: idFrontUrl, id_back_url: idBackUrl, health_cert_url: healthUrl,
      ai_id_check: aiCheck,
    };
    const { error } = await supabase.from("chef_profiles").upsert(payload, { onConflict: "user_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    profile.refetch();
  }

  async function submit() {
    if (!idFrontUrl || !idBackUrl) return toast.error("Upload both sides of your national ID");
    if (!healthUrl) return toast.error("Upload your health certificate");
    if (lat == null || lng == null) return toast.error("Pin your kitchen on the map");
    if (!paymentMethod || !paymentAccount) return toast.error("Choose a payment method and add your account");
    if (zoneInfo && !zoneInfo.inside) return toast.error("Your location is outside our delivery zones");
    await save();
    try { await submitVerification(); toast.success("Submitted for review"); profile.refetch(); }
    catch (e: any) { toast.error(e.message); }
  }

  const status = profile.data?.verification_status ?? "unverified";
  const mapCenter = lat && lng ? { lat, lng } : { lat: 30.0444, lng: 31.2357 };
  const pin = lat && lng ? [{ id: "self", name: "You", lat, lng, radiusKm: 0.2 }] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Chef verification</h1>
        <Badge variant="outline" className="capitalize">{status}</Badge>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about your cooking style." className="mt-2" />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">National ID</h2>
        <p className="text-sm text-muted-foreground">Upload front and back. We run a best-effort AI check to confirm it's a national ID.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>ID front</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUploadIdFront(e.target.files[0])} />
              {idFrontUrl && <Badge variant="secondary"><Upload className="mr-1 h-3 w-3" />uploaded</Badge>}
            </div>
          </div>
          <div>
            <Label>ID back</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUploadIdBack(e.target.files[0])} />
              {idBackUrl && <Badge variant="secondary"><Upload className="mr-1 h-3 w-3" />uploaded</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={runOcr} disabled={!idFrontUrl || busy === "ocr"} variant="outline">
            {busy === "ocr" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Run AI ID check
          </Button>
          {aiCheck && (
            <div className="flex items-center gap-2 text-sm">
              {aiCheck.is_id ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
              <span>
                {aiCheck.is_id ? "Looks like an ID" : "Not confirmed"}
                {typeof aiCheck.confidence === "number" && ` · ${(aiCheck.confidence * 100).toFixed(0)}%`}
                {aiCheck.name ? ` · ${aiCheck.name}` : ""}
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">Kitchen address</h2>
        <div>
          <Label>Street address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2" placeholder="Street, building, area" />
        </div>
        <div>
          <Label>Pin your location on the map</Label>
          <div className="mt-2 overflow-hidden rounded-lg border">
            <GoogleMap markers={pin} center={mapCenter} zoom={12} onMapClick={pickOnMap} />
          </div>
          {lat != null && lng != null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Pinned at {lat.toFixed(4)}, {lng.toFixed(4)}
              {zoneInfo && (
                <span className={`ml-2 inline-flex items-center gap-1 ${zoneInfo.inside ? "text-emerald-600" : "text-destructive"}`}>
                  {zoneInfo.inside ? <>✓ inside {zoneInfo.name}</> : <>✗ outside zones (nearest: {zoneInfo.name}, {zoneInfo.distance_km.toFixed(1)} km)</>}
                </span>
              )}
            </p>
          )}
        </div>
        <div>
          <Label>Address details</Label>
          <Textarea value={addressDetails} onChange={(e) => setAddressDetails(e.target.value)} className="mt-2" placeholder="Floor, apartment, landmark, gate code…" />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">Health certificate</h2>
        <div className="flex items-center gap-2">
          <Input type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && onUploadHealth(e.target.files[0])} />
          {healthUrl && <Badge variant="secondary"><Upload className="mr-1 h-3 w-3" />uploaded</Badge>}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">Payout method</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Payment gateway / method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Choose a method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
                <SelectItem value="Orange Cash">Orange Cash</SelectItem>
                <SelectItem value="Etisalat Cash">Etisalat Cash</SelectItem>
                <SelectItem value="Instapay">Instapay</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="PayPal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Account number / link</Label>
            <Input value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)} placeholder="Phone, IBAN, or PayPal link" className="mt-2" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap gap-2">
          <Button onClick={save}>Save</Button>
          {status !== "approved" && <Button variant="outline" onClick={submit} disabled={status === "pending"}>Submit for verification</Button>}
        </div>
        {status === "rejected" && profile.data?.rejection_reason && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">Rejected: {profile.data.rejection_reason}</p>
        )}
      </Card>
    </div>
  );
}