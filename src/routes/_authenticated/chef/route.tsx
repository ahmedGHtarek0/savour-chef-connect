import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { ChefShell } from "@/components/ChefShell";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef")({
  component: ChefGate,
});

function ChefGate() {
  const { roles, loading } = useAuth();
  if (loading) return null;
  if (!roles.includes("chef")) {
    return (
      <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
        <Navbar />
        <div className="container mx-auto max-w-md py-20 text-center">
          <ChefHat className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Chef access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign up with a chef account to access the kitchen.</p>
          <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
      </div>
    );
  }
  return <ChefShell />;
}