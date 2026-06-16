import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createGroupOrder, joinGroupOrder } from "@/lib/loyalty.functions";

export const Route = createFileRoute("/_authenticated/groups/")({
  component: GroupsPage,
});

function GroupsPage() {
  const qc = useQueryClient();
  const create = useServerFn(createGroupOrder);
  const join = useServerFn(joinGroupOrder);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const groups = useQuery({
    queryKey: ["my-groups"],
    queryFn: async () => {
      const { data: mine } = await supabase
        .from("group_members")
        .select("group_id");
      const ids = (mine ?? []).map((m) => m.group_id);
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("group_orders")
        .select("id, name, status, host_id, created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      await create({ data: { name: name.trim() } });
      setName("");
      qc.invalidateQueries({ queryKey: ["my-groups"] });
      toast.success("Group created");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const onJoin = async () => {
    if (!code.trim()) return;
    try {
      await join({ data: { groupId: code.trim() } });
      setCode("");
      qc.invalidateQueries({ queryKey: ["my-groups"] });
      toast.success("Joined group");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Group orders</h1>
            <p className="text-sm text-muted-foreground">Order together with friends, family, or the office.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur">
            <h3 className="mb-3 font-semibold">Start a group</h3>
            <Input placeholder="Friday lunch" value={name} onChange={(e) => setName(e.target.value)} />
            <Button className="mt-3 w-full" onClick={onCreate}><Plus className="mr-2 h-4 w-4" />Create</Button>
          </div>
          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur">
            <h3 className="mb-3 font-semibold">Join with an invite ID</h3>
            <Input placeholder="Group ID" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button variant="outline" className="mt-3 w-full" onClick={onJoin}>Join</Button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Your groups</h2>
          {groups.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (groups.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups yet.</p>
          ) : (
            <ul className="space-y-2">
              {(groups.data ?? []).map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {g.id}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{g.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Tip: share the group ID with friends so they can join. Place orders from <Link to="/browse" className="underline">browse</Link>.
        </p>
      </div>
    </div>
  );
}