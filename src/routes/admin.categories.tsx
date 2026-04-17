import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesAdmin,
});

type Cat = { id: string; name: string; slug: string; description: string | null; icon: string | null };

function CategoriesAdmin() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("Compass");

  async function load() {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCats((data ?? []) as Cat[]);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name), description: desc.trim() || null, icon });
    if (error) return toast.error(error.message);
    setName(""); setDesc("");
    toast.success("Added");
    load();
  }
  async function remove(c: Cat) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Categories</h1>
      <form onSubmit={add} className="mt-8 grid gap-3 rounded-sm border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_140px_auto]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon (lucide name)" className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
        <button className="inline-flex items-center justify-center gap-1 rounded-sm bg-gradient-gold px-4 py-2 text-xs uppercase-track text-gold-foreground"><Plus className="h-3 w-3" /> Add</button>
      </form>

      <div className="mt-6 overflow-hidden rounded-sm border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-[10px] uppercase-track text-muted-foreground">
            <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Slug</th><th className="px-4 py-3 text-left hidden md:table-cell">Description</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.description}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(c)} className="rounded p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
