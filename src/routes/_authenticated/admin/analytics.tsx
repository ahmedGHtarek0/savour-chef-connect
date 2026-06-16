import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { DollarSign, ShoppingBag, Users, ChefHat, Bike, Clock } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const orders = useQuery({
    queryKey: ["admin", "orders-30d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from("orders")
        .select("id, total, status, created_at, customer_id")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(1000);
      return data ?? [];
    },
  });

  const countsQ = useQuery({
    queryKey: ["admin", "stats-counts"],
    queryFn: async () => {
      const [chefs, drivers, customers] = await Promise.all([
        supabase.from("chef_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "approved"),
        supabase.from("delivery_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        chefs: chefs.count ?? 0,
        drivers: drivers.count ?? 0,
        customers: customers.count ?? 0,
      };
    },
  });

  const series = useMemo(() => {
    const days = new Map<string, { date: string; orders: number; revenue: number }>();
    const start = new Date(Date.now() - 29 * 86400000);
    for (let i = 0; i < 30; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.set(key, { date: key.slice(5), orders: 0, revenue: 0 });
    }
    for (const o of orders.data ?? []) {
      const key = String(o.created_at).slice(0, 10);
      const bucket = days.get(key);
      if (!bucket) continue;
      bucket.orders += 1;
      bucket.revenue += Number(o.total ?? 0);
    }
    return Array.from(days.values());
  }, [orders.data]);

  const statusBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of orders.data ?? []) m[o.status] = (m[o.status] ?? 0) + 1;
    return Object.entries(m).map(([status, count]) => ({ status, count }));
  }, [orders.data]);

  const totalOrders = orders.data?.length ?? 0;
  const totalRevenue = (orders.data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
  const delivered = (orders.data ?? []).filter((o) => o.status === "delivered").length;
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;

  const kpis = [
    { label: "Revenue (30d)", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: "Orders (30d)", value: totalOrders, icon: ShoppingBag },
    { label: "Avg. order", value: `$${avgOrder.toFixed(2)}`, icon: Clock },
    { label: "Delivered", value: delivered, icon: ShoppingBag },
    { label: "Approved chefs", value: countsQ.data?.chefs ?? "—", icon: ChefHat },
    { label: "Approved drivers", value: countsQ.data?.drivers ?? "—", icon: Bike },
    { label: "Total users", value: countsQ.data?.customers ?? "—", icon: Users },
  ];

  return (
    <AdminShell title="Analytics">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <k.icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-background/60 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Revenue — last 30 days
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Orders per day
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Status breakdown
          </h3>
          <ul className="space-y-2 text-sm">
            {statusBreakdown.length === 0 && (
              <li className="text-muted-foreground">No orders yet.</li>
            )}
            {statusBreakdown.map((s) => (
              <li key={s.status} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                <span className="capitalize">{s.status.replace(/_/g, " ")}</span>
                <span className="font-semibold">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}