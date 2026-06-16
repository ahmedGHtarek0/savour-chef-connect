import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Bike, Inbox, MapPin, UserCog } from "lucide-react";

const NAV = [
  { to: "/delivery", label: "Overview", icon: Bike, exact: true },
  { to: "/delivery/jobs", label: "Available jobs", icon: Inbox, exact: false },
  { to: "/delivery/active", label: "Active job", icon: MapPin, exact: false },
  { to: "/delivery/profile", label: "Profile", icon: UserCog, exact: false },
] as const;

export function DeliveryShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto flex gap-6 px-4 py-8">
        <aside className="w-56 shrink-0 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}