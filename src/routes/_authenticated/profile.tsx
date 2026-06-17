import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, roles } = useAuth();
  const profile = useQuery({
    queryKey: ["my_profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setFullName(profile.data.full_name ?? "");
    setUsername(profile.data.username ?? "");
    setEmail(profile.data.email ?? "");
    setPhone(profile.data.phone ?? "");
    setAvatar(profile.data.avatar_url ?? "");
  }, [profile.data]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, username, email: email || null, phone: phone || null, avatar_url: avatar || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (email && email !== profile.data?.email) {
      const { error: e2 } = await supabase.auth.updateUser({ email });
      if (e2) toast.error("Saved profile, but auth email update failed: " + e2.message);
      else toast.success("Saved — check your inbox to confirm the new email");
    } else {
      toast.success("Profile saved");
    }
    profile.refetch();
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My profile</h1>
          <div className="flex gap-1">{roles.map(r => <Badge key={r} variant="outline" className="capitalize">{r}</Badge>)}</div>
        </div>
        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            {avatar ? <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="h-16 w-16 rounded-full bg-muted" />}
            <div className="flex-1">
              <Label>Avatar URL</Label>
              <Input value={avatar} onChange={e => setAvatar(e.target.value)} className="mt-2" placeholder="https://…" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Full name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-2" /></div>
            <div><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} className="mt-2" /></div>
            <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} className="mt-2" type="email" /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-2" /></div>
          </div>
          <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></div>
        </Card>
      </div>
    </div>
  );
}