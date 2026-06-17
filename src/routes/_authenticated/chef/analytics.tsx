import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { DollarSign, ShoppingBag, Users, TrendingUp, Star, Repeat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chef/analytics")({
  component: ChefAnalytics,
});

const STATUS_COLORS: Record<string, string> = {
  placed: "#94a3b8",
  accepted: "#60a5fa",
  preparing: "#fbbf24",
  ready_for_pickup: "#a78bfa",
  out_for_delivery: "#34d399",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

function ChefAnalytics() {
  const { user } = useAuth();

  const data = useQuery({
    queryKey: ["chef_analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [oi, rv, items] = await Promise.all([
        supabase
          .from("order_items")
          .select("qty, unit_price, item_id, items(name), orders!inner(id, status, customer_id, created_at)")
          .eq("chef_id", user!.id)
          .gte("orders.created_at", since),
        supabase.from("reviews").select("rating, created_at").eq("chef_id", user!.id),
        supabase.from("chef_items").select("id, available").eq("chef_id", user!.id),
      ]);
      return { oi: oi.data ?? [], rv: rv.data ?? [], items: items.data ?? [] };
    },
  });

  const charts = useMemo(() => {
    const oi = (data.data?.oi ?? []) as any[];
    const rv = (data.data?.rv ?? []) as any[];

    const byDay = new Map<string, { day: string; revenue: number; orders: Set<string> }>();
    const byStatus = new Map<string, number>();
    const byItem = new Map<string, { name: string; qty: number; revenue: number }>();
    const customers = new Map<string, number>();
    const ratingBuckets = [0, 0, 0, 0, 0];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      byDay.set(d, { day: d.slice(5), revenue: 0, orders: new Set() });
    }

    for (const o of oi) {
      const day = (o.orders?.created_at ?? "").slice(0, 10);
      const short = day.slice(5);
      const row = Array.from(byDay.values()).find((r) => r.day === short);
      const rev = Number(o.unit_price) * Number(o.qty);
      if (row) { row.revenue += rev; row.orders.add(o.orders?.id); }
      const st = o.orders?.status ?? "placed";
      byStatus.set(st, (byStatus.get(st) ?? 0) + 1);
      const name = o.items?.name ?? "Item";
      const prev = byItem.get(o.item_id) ?? { name, qty: 0, revenue: 0 };
      prev.qty += Number(o.qty); prev.revenue += rev;
      byItem.set(o.item_id, prev);
      const cid = o.orders?.customer_id;
      if (cid) customers.set(cid, (customers.get(cid) ?? 0) + 1);
    }
    for (const r of rv) ratingBuckets[(r.rating ?? 1) - 1]++;

    const days = Array.from(byDay.values()).map((r) => ({ day: r.day, revenue: Number(r.revenue.toFixed(2)), orders: r.orders.size }));
    const status = Array.from(byStatus.entries()).map(([name, value]) => ({ name, value }));
    const top = Array.from(byItem.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    const returning = Array.from(customers.values()).filter((n) => n > 1).length;
    const ratings = ratingBuckets.map((v, i) => ({ stars: `${i + 1}★`, count: v }));
    const totalRev = days.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = days.reduce((s, d) => s + d.orders, 0);
    const avgRating = rv.length ? rv.reduce((s: number, r: any) => s + r.rating, 0) / rv.length : null;

    return { days, status, top, returning, ratings, totalRev, totalOrders, avgRating, uniqueCustomers: customers.size };
  }, [data.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last 30 days — revenue, orders, customers, and menu performance.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={DollarSign} label="Revenue 30d" value={charts.totalRev.toFixed(2)} />
        <Kpi icon={ShoppingBag} label="Orders 30d" value={charts.totalOrders} />
        <Kpi icon={Users} label="Customers" value={charts.uniqueCustomers} sub={`${charts.returning} returning`} />
        <Kpi icon={Star} label="Avg rating" value={charts.avgRating ? charts.avgRating.toFixed(2) : "—"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4" /> Revenue — last 14 days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.days}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShoppingBag className="h-4 w-4" /> Orders — last 14 days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.days}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Order status breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.status} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {charts.status.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? "#94a3b8"} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Star className="h-4 w-4" /> Rating distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.ratings}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="stars" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Repeat className="h-4 w-4" /> Top items by revenue</h2>
        {charts.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet in the last 30 days.</p>
        ) : (
          <div className="divide-y divide-border">
            {charts.top.map((t, i) => (
              <div key={t.name + i} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{i + 1}. {t.name}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{t.qty} sold</Badge>
                  <span className="font-mono">{t.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: any; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Icon className="h-3 w-3" /> {label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}