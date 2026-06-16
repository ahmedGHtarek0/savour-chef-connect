import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { DeliveryShell } from "@/components/DeliveryShell";
import { Button } from "@/components/ui/button";
import { Bike } from "lucide-react";

export const Route = createFileRoute("/_authenticated/delivery")({
  component: DeliveryGate,
});

function DeliveryGate() {
  const { roles, loading } = useAuth();
  if (loading) return null;
  if (!roles.includes("delivery")) {
    return (
      <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
        <Navbar />
        <div className="container mx-auto max-w-md py-20 text-center">
          <Bike className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Delivery access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign up as a delivery partner to accept jobs.</p>
          <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
      </div>
    );
  }
  return <DeliveryShell />;
}