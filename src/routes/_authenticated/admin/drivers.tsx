import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DocPreview } from "@/components/DocPreview";
import { useServerFn } from "@tanstack/react-start";
import { verifyDriver } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/drivers")({
  component: DriversAdmin,
});

function DriversAdmin() {
  const qc = useQueryClient();
  const verify = useServerFn(verifyDriver);
  const [reason, setReason] = useState<Record<string, string>>({});

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "drivers"],
    queryFn: async () =>
      (
        await supabase
          .from("delivery_profiles")
          .select(
            "user_id, verification_status, rejection_reason, submitted_at, id_front_url, id_back_url, vehicle_license_url, driving_license_url, vehicle_photo_url, profiles!delivery_profiles_user_id_fkey(full_name, email, phone)"
          )
          .order("submitted_at", { ascending: false, nullsFirst: false })
      ).data ?? [],
  });

  const act = async (driverId: string, status: "approved" | "rejected") => {
    try {
      await verify({
        data: { driverId, status, rejectionReason: status === "rejected" ? reason[driverId] ?? null : null },
      });
      toast.success(status === "approved" ? "Driver approved" : "Driver rejected");
      qc.invalidateQueries({ queryKey: ["admin", "drivers"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <AdminShell title="Driver verification">
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && data.length === 0 && (
        <p className="text-sm text-muted-foreground">No driver applications yet.</p>
      )}
      <div className="space-y-4">
        {data.map((d: any) => (
          <div key={d.user_id} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{d.profiles?.full_name ?? "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">
                  {d.profiles?.email ?? d.profiles?.phone ?? "—"}
                </p>
                {d.submitted_at && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Submitted {new Date(d.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  d.verification_status === "approved"
                    ? "default"
                    : d.verification_status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {d.verification_status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <DocPreview bucket="delivery-docs" path={d.id_front_url} label="ID front" />
              <DocPreview bucket="delivery-docs" path={d.id_back_url} label="ID back" />
              <DocPreview bucket="delivery-docs" path={d.driving_license_url} label="License" />
              <DocPreview bucket="delivery-docs" path={d.vehicle_license_url} label="Vehicle reg." />
              <DocPreview bucket="delivery-docs" path={d.vehicle_photo_url} label="Vehicle photo" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Input
                placeholder="Reason (optional, for rejection)"
                value={reason[d.user_id] ?? ""}
                onChange={(e) => setReason((r) => ({ ...r, [d.user_id]: e.target.value }))}
                className="max-w-md"
              />
              <Button size="sm" onClick={() => act(d.user_id, "approved")}>
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(d.user_id, "rejected")}>
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </div>

            {d.rejection_reason && (
              <p className="mt-2 text-xs text-destructive">Last reason: {d.rejection_reason}</p>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}