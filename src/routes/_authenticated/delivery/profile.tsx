import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { submitDeliveryForVerification } from "@/lib/delivery.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/delivery/profile")({
  component: DeliveryProfile,
});

type DocKey = "id_front_url" | "id_back_url" | "driving_license_url" | "vehicle_license_url" | "vehicle_photo_url";
const DOCS: { key: DocKey; label: string }[] = [
  { key: "id_front_url", label: "National ID — front" },
  { key: "id_back_url", label: "National ID — back" },
  { key: "driving_license_url", label: "Driving license" },
  { key: "vehicle_license_url", label: "Vehicle license" },
  { key: "vehicle_photo_url", label: "Vehicle photo" },
];

function DeliveryProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const submit = useServerFn(submitDeliveryForVerification);

  const profile = useQuery({
    queryKey: ["delivery_profile_full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created, error: cErr } = await supabase
          .from("delivery_profiles")
          .insert({ user_id: user!.id })
          .select("*").maybeSingle();
        if (cErr) throw cErr;
        return created;
      }
      return data;
    },
  });

  const submitMut = useMutation({
    mutationFn: () => submit({}),
    onSuccess: () => { toast.success("Submitted for review"); qc.invalidateQueries({ queryKey: ["delivery_profile_full"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const v = profile.data?.verification_status ?? "not_submitted";
  const allUploaded = DOCS.every((d) => !!(profile.data as any)?.[d.key]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Driver profile</h1>
        <Badge variant="outline">{v}</Badge>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">Verification documents</h2>
        <p className="mt-1 text-xs text-muted-foreground">Upload clear photos. Files are private and only visible to you and admins.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {DOCS.map((d) => (
            <DocUploader key={d.key} field={d.key} label={d.label}
              url={(profile.data as any)?.[d.key] ?? null}
              onChange={() => qc.invalidateQueries({ queryKey: ["delivery_profile_full"] })} />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {allUploaded ? "All set — submit for admin review." : "Upload all 5 documents to submit."}
          </p>
          <Button disabled={!allUploaded || v === "pending" || v === "approved" || submitMut.isPending} onClick={() => submitMut.mutate()}>
            {v === "approved" ? <><CheckCircle2 className="mr-2 h-4 w-4" />Approved</> :
              v === "pending" ? "Awaiting review" : "Submit for verification"}
          </Button>
        </div>
        {profile.data?.rejection_reason && v === "rejected" && (
          <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{profile.data.rejection_reason}</p>
        )}
      </Card>
    </div>
  );
}

function DocUploader({ field, label, url, onChange }: { field: DocKey; label: string; url: string | null; onChange: () => void }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    if (!user) return;
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${field}-${Date.now()}.${ext}`;
      const { error: uErr } = await supabase.storage.from("delivery-docs").upload(path, file, { upsert: true });
      if (uErr) throw uErr;
      const patch =
        field === "id_front_url" ? { id_front_url: path } :
        field === "id_back_url" ? { id_back_url: path } :
        field === "driving_license_url" ? { driving_license_url: path } :
        field === "vehicle_license_url" ? { vehicle_license_url: path } :
        { vehicle_photo_url: path };
      const { error: dbErr } = await supabase.from("delivery_profiles").update(patch).eq("user_id", user.id);
      if (dbErr) throw dbErr;
      toast.success(`${label} uploaded`);
      onChange();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <Label className="text-sm">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <Input ref={inputRef} type="file" accept="image/*"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} disabled={busy} />
        {url && <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" /> Saved</Badge>}
      </div>
      {busy && <p className="mt-1 text-xs text-muted-foreground"><Upload className="mr-1 inline h-3 w-3" /> Uploading…</p>}
    </div>
  );
}