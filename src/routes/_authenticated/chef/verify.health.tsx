import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chef/verify/health")({
  component: VerifyHealth,
});

function VerifyHealth() {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ["chef_profile_verify", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("chef_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { setUrl(profile.data?.health_cert_url ?? null); }, [profile.data]);

  async function up(file: File) {
    if (!user) return;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/health-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chef-docs").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    setUrl(path); toast.success("Uploaded");
  }

  async function save() {
    if (!user) return;
    if (!url) return toast.error("Upload your certificate first");
    const { error } = await supabase.from("chef_profiles").upsert({ user_id: user.id, health_cert_url: url }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    toast.success("Saved"); profile.refetch();
  }

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Health certificate</h2>
      <p className="text-sm text-muted-foreground">Upload your food-handler / health certificate (image or PDF).</p>
      <div className="flex items-center gap-2">
        <Input type="file" accept="image/*,application/pdf" onChange={e => e.target.files?.[0] && up(e.target.files[0])} />
        {url && <Badge variant="secondary"><Upload className="mr-1 h-3 w-3" />uploaded</Badge>}
      </div>
      <div className="flex justify-end"><Button onClick={save}>Save step</Button></div>
    </Card>
  );
}