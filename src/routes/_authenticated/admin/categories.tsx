import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const add = async () => {
    if (!name || !slug) return;
    const { error } = await supabase.from("categories").insert({ name, slug });
    if (error) return toast.error(error.message);
    setName(""); setSlug("");
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    toast.success("Category added");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("categories").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
  };

  return (
    <AdminShell title="Categories">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-background/60 p-4">
        <div className="flex-1 min-w-[180px]"><Input placeholder="Name (e.g. Mains)" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="flex-1 min-w-[180px]"><Input placeholder="slug-like-this" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} /></div>
        <Button onClick={add} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Add category</Button>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {data.map(c => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3"><button onClick={() => toggle(c.id, c.active)} className={`rounded-full px-2 py-1 text-xs ${c.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{c.active ? "Active" : "Inactive"}</button></td>
                <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}