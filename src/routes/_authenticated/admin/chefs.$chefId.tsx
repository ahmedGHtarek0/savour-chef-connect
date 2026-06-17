import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { verifyChef } from "@/lib/admin.functions";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Check, X, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/chefs/$chefId")({
  component: ChefDetail,
});

function ChefDetail() {
  const { chefId } = Route.useParams();
  const qc = useQueryClient();
  const verify = useServerFn(verifyChef);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "chef", chefId],
    queryFn: async () => {
      const { data } = await supabase.from("chef_profiles").select("*, profiles!chef_profiles_user_id_fkey(full_name, email, phone, username), zones(name)").eq("user_id", chefId).maybeSingle();
      return data;
    },
  });

  async function signedUrl(p: string | null | undefined) {
    if (!p) return null;
    const { data } = await supabase.storage.from("chef-docs").createSignedUrl(p, 300);
    return data?.signedUrl ?? null;
  }

  const docs = useQuery({
    queryKey: ["admin", "chef-docs", chefId, data?.id_front_url, data?.id_back_url, data?.health_cert_url],
    enabled: !!data,
    queryFn: async () => ({
      front: await signedUrl(data?.id_front_url),
      back: await signedUrl(data?.id_back_url),
      health: await signedUrl(data?.health_cert_url),
    }),
  });

  async function approve() {
    await verify({ data: { chefId, status: "approved" } });
    toast.success("Chef approved");
    qc.invalidateQueries({ queryKey: ["admin"] });
  }
  async function reject() {
    if (!reason.trim()) return toast.error("Please tell the chef why");
    await verify({ data: { chefId, status: "rejected", rejectionReason: reason.trim() } });
    toast.success("Rejection sent to chef");
    setOpen(false); setReason("");
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  if (isLoading) return <AdminShell title="Chef request"><p className="text-muted-foreground">Loading…</p></AdminShell>;
  if (!data) return <AdminShell title="Chef request"><p>Not found</p></AdminShell>;
  const p: any = (data as any).profiles ?? {};
  const ai: any = (data as any).ai_id_check ?? null;

  return (
    <AdminShell title="Chef request">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm"><Link to="/admin/chefs"><ArrowLeft className="mr-1 h-4 w-4" /> Back to queue</Link></Button>
          <Badge variant={data.verification_status === "approved" ? "default" : data.verification_status === "rejected" ? "destructive" : "secondary"}>
            {data.verification_status}
          </Badge>
        </div>

        <Card className="grid gap-4 p-5 md:grid-cols-2">
          <Info label="Name" value={p.full_name ?? "—"} />
          <Info label="Username" value={p.username ?? "—"} />
          <Info label="Email" value={p.email ?? "—"} />
          <Info label="Phone" value={p.phone ?? "—"} />
          <Info label="Address" value={data.address ?? "—"} />
          <Info label="Details" value={data.address_details ?? "—"} />
          <Info label="Zone" value={(data as any).zones?.name ?? "—"} />
          <Info label="Pinned" value={data.lat && data.lng ? `${Number(data.lat).toFixed(4)}, ${Number(data.lng).toFixed(4)}` : "—"} />
          <Info label="Payout method" value={data.payment_method ?? "—"} />
          <Info label="Payout account" value={data.payment_account ?? "—"} />
          <Info label="Max orders / day" value={String(data.max_orders_per_day ?? "—")} />
          <Info label="Submitted" value={data.submitted_at ? new Date(data.submitted_at).toLocaleString() : "—"} />
        </Card>

        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">Documents</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <DocCard label="ID front" url={docs.data?.front ?? null} />
            <DocCard label="ID back" url={docs.data?.back ?? null} />
            <DocCard label="Health certificate" url={docs.data?.health ?? null} />
          </div>
          {ai && (
            <p className="text-xs text-muted-foreground">
              AI ID check: {ai.is_id ? "✓ confirmed" : "✗ not confirmed"}
              {typeof ai.confidence === "number" && ` · ${(ai.confidence * 100).toFixed(0)}%`}
              {ai.name ? ` · ${ai.name}` : ""}
            </p>
          )}
        </Card>

        <Card className="flex flex-wrap justify-end gap-2 p-5">
          <Button onClick={approve}><Check className="mr-1 h-4 w-4" /> Approve</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="destructive"><X className="mr-1 h-4 w-4" /> Reject with reason</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Reject chef</DialogTitle></DialogHeader>
              <Label>Tell the chef why (they'll see this on their dashboard)</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. ID image is blurry, please upload a clearer photo." />
              <DialogFooter><Button variant="destructive" onClick={reject}>Send rejection</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
function DocCard({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {url && <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">Open <ExternalLink className="h-3 w-3" /></a>}
      </div>
      {url ? (
        url.match(/\.pdf/i) ? <p className="mt-2 text-xs text-muted-foreground">PDF document</p>
          : <img src={url} alt={label} className="mt-2 max-h-48 w-full rounded object-cover" />
      ) : <p className="mt-2 text-xs text-muted-foreground">Not provided</p>}
    </div>
  );
}