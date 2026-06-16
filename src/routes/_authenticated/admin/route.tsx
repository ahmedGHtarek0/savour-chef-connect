import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServerFn } from "@tanstack/react-start";
import { claimAdminIfUnclaimed } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminGate,
});

function AdminGate() {
  const { roles, user, loading } = useAuth();
  const isAdmin = roles.includes("admin");
  const claim = useServerFn(claimAdminIfUnclaimed);
  const [claiming, setClaiming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (isAdmin) return <Outlet />;

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await claim();
      if (res.granted) {
        toast.success("You are now the admin. Refreshing…");
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast.error("An admin already exists. Ask them to grant you access.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Could not claim admin");
    } finally { setClaiming(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Admin access required</h1>
        <p className="max-w-md text-muted-foreground">
          You don't have admin privileges. If no admin has been set up yet, you can claim the first admin seat for this workspace.
        </p>
        <Button onClick={handleClaim} disabled={claiming} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          {claiming ? "Claiming…" : "Claim admin seat"}
        </Button>
      </div>
    </div>
  );
}