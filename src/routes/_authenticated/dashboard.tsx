import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ChefHat, ShoppingBag, Bike, Shield, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const ROLE_CARDS = {
  admin: { icon: Shield, title: "Admin console", body: "Manage chefs, zones, gateways, and verifications.", to: "/admin" as const },
  chef: { icon: ChefHat, title: "Chef kitchen", body: "Manage your menu, accept orders, track payouts.", to: "/chef" as const },
  customer: { icon: ShoppingBag, title: "Order food", body: "Browse home chefs near you and track your orders.", to: "/browse" as const },
  delivery: { icon: Bike, title: "Delivery", body: "Accept jobs, navigate, and confirm drop-offs.", to: "/delivery" as const },
} as const;

function Dashboard() {
  const { user, roles } = useAuth();
  const { t } = useTranslation();
  const activeRoles = roles.length ? roles : (["customer"] as const);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">{t("common.welcome")}</p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">{user?.user_metadata?.full_name ?? user?.email}</h1>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {activeRoles.map((r, i) => {
            const c = ROLE_CARDS[r as keyof typeof ROLE_CARDS] ?? ROLE_CARDS.customer;
            const Icon = c.icon;
            return (
              <motion.div
                key={r}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur shadow-[var(--shadow-elegant)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t(`roles.${r}`)}</div>
                <h3 className="mt-1 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
                <Button asChild className="mt-5"><Link to={c.to}>{t("common.continue")}</Link></Button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">More</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/memberships" className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur transition hover:bg-card">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Memberships</p>
                <p className="text-xs text-muted-foreground">Unlock free delivery & perks</p>
              </div>
            </Link>
            <Link to="/groups" className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur transition hover:bg-card">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Group orders</p>
                <p className="text-xs text-muted-foreground">Order together with friends</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}