import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { aiIdCheck } from "@/lib/chef-verify.functions";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef/verify/id")({
  component: VerifyId,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
}

function VerifyId() {
  const { user } = useAuth();
  const runIdCheck = useServerFn(aiIdCheck);
  const profile = useQuery({
    queryKey: ["chef_profile_verify", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("chef_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [aiCheck, setAi] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.data) return;
    setIdFront(profile.data.id_front_url ?? null);
    setIdBack(profile.data.id_back_url ?? null);
    setAi(profile.data.ai_id_check ?? null);
  }, [profile.data]);

  async function up(field: "id_front" | "id_back", file: File) {
    if (!user) return null;
    setBusy(field);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chef-docs").upload(path, file, { upsert: true });
    setBusy(null);
    if (error) { toast.error(error.message); return null; }
    toast.success("Uploaded"); return path;
  }

  async function runOcr() {
    if (!idFront) return toast.error("Upload ID front first");
    setBusy("ocr");
    try {
      const f = await supabase.storage.from("chef-docs").createSignedUrl(idFront, 60);
      const frontUrl = f.data?.signedUrl; if (!frontUrl) throw new Error("Could not read file");
      const frontData = await fileToDataUrl(new File([await (await fetch(frontUrl)).blob()], "f"));
      let backData: string | undefined;
      if (idBack) {
        const b = await supabase.storage.from("chef-docs").createSignedUrl(idBack, 60);
        if (b.data?.signedUrl) backData = await fileToDataUrl(new File([await (await fetch(b.data.signedUrl)).blob()], "b"));
      }
      const { result } = await runIdCheck({ data: { frontDataUrl: frontData, backDataUrl: backData } });
      setAi(result);
      toast.success(result?.is_id ? "Looks like a valid ID" : "Could not confirm — best effort only");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }

  async function save() {
    if (!user) return;
    if (!idFront || !idBack) return toast.error("Upload both sides first");
    if (!aiCheck?.is_id) {
      if (!confirm("AI couldn't confirm this is a valid ID. Save anyway?")) return;
    }
    const { error } = await supabase.from("chef_profiles").upsert({
      user_id: user.id, id_front_url: idFront, id_back_url: idBack, ai_id_check: aiCheck,
    }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    toast.success("Saved");
    profile.refetch();
  }

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">National ID</h2>
      <p className="text-sm text-muted-foreground">Upload both sides. We'll run an AI check; only confirmed IDs are saved.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>ID front</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input type="file" accept="image/*" onChange={async e => { const p = await up("id_front", e.target.files![0]); if (p) setIdFront(p); }} />
            {idFront && <Badge variant="secondary"><Upload className="mr-1 h-3 w-3" />uploaded</Badge>}
          </div>
        </div>
        <div>
          <Label>ID back</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input type="file" accept="image/*" onChange={async e => { const p = await up("id_back", e.target.files![0]); if (p) setIdBack(p); }} />
            {idBack && <Badge variant="secondary"><Upload className="mr-1 h-3 w-3" />uploaded</Badge>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runOcr} disabled={!idFront || busy === "ocr"} variant="outline">
          {busy === "ocr" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Run AI ID check
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
        <div className="ml-auto"><Button onClick={save}>Save step</Button></div>
      </div>
    </Card>
  );
}