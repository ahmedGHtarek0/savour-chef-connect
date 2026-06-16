import { Link, useLocation } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { LayoutDashboard, FolderTree, UtensilsCrossed, Map, ShieldCheck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/items", label: "Items library", icon: UtensilsCrossed },
  { to: "/admin/zones", label: "Zones", icon: Map },
  { to: "/admin/chefs", label: "Chef verification", icon: ShieldCheck },
  { to: "/admin/gateways", label: "Payment gateways", icon: CreditCard },
] as const;

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-border bg-card/80 p-3 backdrop-blur h-fit sticky top-20">
          <nav className="flex flex-col gap-1">
            {NAV.map(n => {
              const active = pathname === n.to;
              const Icon = n.icon;
              return (
                <Link key={n.to} to={n.to} className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[var(--shadow-elegant)]" : "hover:bg-muted text-foreground"
                )}>
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur min-h-[60vh]">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}