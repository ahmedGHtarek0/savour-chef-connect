import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { verifyChef } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Check, X, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/chefs")({
  component: ChefsPage,
});

function ChefsPage() {
  const qc = useQueryClient();
  const verify = useServerFn(verifyChef);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "chefs"],
    queryFn: async () => (await supabase.from("chef_profiles").select("*, profiles!chef_profiles_user_id_fkey(full_name, email, phone)").order("created_at", { ascending: false })).data ?? [],
  });

  const act = async (chefId: string, status: "approved" | "rejected") => {
    try {
      await verify({ data: { chefId, status } });
      toast.success(status === "approved" ? "Chef approved" : "Chef rejected");
      qc.invalidateQueries({ queryKey: ["admin", "chefs"] });
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <AdminShell title="Chef verification queue">
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr><th className="p-3">Chef</th><th className="p-3">Contact</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && data.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No chef profiles yet.</td></tr>}
            {data.map((c: any) => (
              <tr key={c.user_id} className="border-t border-border">
                <td className="p-3 font-medium">{c.profiles?.full_name ?? c.business_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{c.profiles?.email ?? c.profiles?.phone ?? "—"}</td>
                <td className="p-3">
                  <Badge variant={c.verification_status === "approved" ? "default" : c.verification_status === "rejected" ? "destructive" : "secondary"}>
                    {c.verification_status}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/chefs/$chefId" params={{ chefId: c.user_id }}><Eye className="h-4 w-4 mr-1" /> Review</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(c.user_id, "approved")}><Check className="h-4 w-4 mr-1" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => act(c.user_id, "rejected")}><X className="h-4 w-4 mr-1" /> Reject</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}