import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/posts/")({
  component: PostsList,
});

type Row = { id: string; slug: string; title: string; status: string; featured: boolean; published_at: string | null; created_at: string; categories: { name: string } | null };

function PostsList() {
  const [posts, setPosts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("posts").select("id,slug,title,status,featured,published_at,created_at,categories(name)").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPosts((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleFeatured(p: Row) {
    const { error } = await supabase.from("posts").update({ featured: !p.featured }).eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function remove(p: Row) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Posts</h1>
        <Link to="/admin/posts/$id" params={{ id: "new" }} className="inline-flex items-center gap-2 rounded-sm bg-gradient-gold px-4 py-2 text-xs uppercase-track text-gold-foreground">
          <Plus className="h-3 w-3" /> New post
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-sm border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No posts yet. Create your first one.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-[10px] uppercase-track text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.featured && <Star className="h-3 w-3 fill-gold text-gold" />}
                      <span className="font-medium">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase-track ${
                      p.status === "published" ? "bg-gold/15 text-gold" :
                      p.status === "scheduled" ? "bg-blue-500/15 text-blue-400" : "bg-muted text-muted-foreground"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{formatDate(p.published_at ?? p.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => toggleFeatured(p)} title="Toggle featured" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-gold">
                        <Star className={`h-4 w-4 ${p.featured ? "fill-gold text-gold" : ""}`} />
                      </button>
                      <Link to="/admin/posts/$id" params={{ id: p.id }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-gold">
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(p)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
