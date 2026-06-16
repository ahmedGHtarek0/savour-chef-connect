import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DocPreview } from "@/components/DocPreview";
import { useServerFn } from "@tanstack/react-start";
import { reviewPaymentReceipt } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/receipts")({
  component: ReceiptsAdmin,
});

function ReceiptsAdmin() {
  const qc = useQueryClient();
  const review = useServerFn(reviewPaymentReceipt);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "receipts", filter],
    queryFn: async () => {
      let q = supabase
        .from("payment_receipts")
        .select(
          "id, status, image_url, notes, created_at, order_id, orders!payment_receipts_order_id_fkey(total, customer_id, payment_gateways(name))"
        )
        .order("created_at", { ascending: false });
      if (filter === "pending") q = q.eq("status", "pending");
      const { data } = await q;
      return data ?? [];
    },
  });

  const act = async (id: string, status: "verified" | "rejected") => {
    try {
      await review({ data: { receiptId: id, status, notes: notes[id] ?? null } });
      toast.success(status === "verified" ? "Payment verified" : "Receipt rejected");
      qc.invalidateQueries({ queryKey: ["admin", "receipts"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <AdminShell title="Payment receipts">
      <div className="mb-4 flex gap-2">
        <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
          Pending
        </Button>
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing to review.</p>
      )}

      <div className="space-y-4">
        {data.map((r: any) => (
          <div key={r.id} className="grid gap-4 rounded-xl border border-border bg-background/60 p-4 md:grid-cols-[200px_1fr]">
            <DocPreview bucket="payment-receipts" path={r.image_url} label="Receipt" />
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link to="/orders/$orderId" params={{ orderId: r.order_id }} className="font-mono text-xs underline">
                    #{String(r.order_id).slice(0, 8)}
                  </Link>
                  <p className="text-sm">
                    Total: <span className="font-semibold">{Number(r.orders?.total ?? 0).toFixed(2)}</span>
                    {r.orders?.payment_gateways?.name && (
                      <span className="text-muted-foreground"> via {r.orders.payment_gateways.name}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Uploaded {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={
                    r.status === "verified" ? "default" : r.status === "rejected" ? "destructive" : "secondary"
                  }
                >
                  {r.status}
                </Badge>
              </div>
              {r.status === "pending" && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="Note (optional)"
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    className="max-w-md"
                  />
                  <Button size="sm" onClick={() => act(r.id, "verified")}>
                    <Check className="mr-1 h-4 w-4" /> Verify
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => act(r.id, "rejected")}>
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
              {r.notes && <p className="mt-2 text-xs text-muted-foreground">Note: {r.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}