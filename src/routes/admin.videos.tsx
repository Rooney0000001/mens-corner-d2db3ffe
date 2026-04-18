import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { VideoEmbed } from "@/components/video-embed";
import type { VideoWithCategory } from "@/lib/videos";

export const Route = createFileRoute("/admin/videos")({
  component: AdminVideos,
});

type Cat = { id: string; name: string };

function AdminVideos() {
  const [videos, setVideos] = useState<VideoWithCategory[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    category_id: "",
    published: true,
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: vs }, { data: cs }] = await Promise.all([
      supabase.from("videos").select("*, categories(*)").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name").order("name"),
    ]);
    setVideos((vs ?? []) as VideoWithCategory[]);
    setCats((cs ?? []) as Cat[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.title.trim() || !form.video_url.trim()) {
      toast.error("Title and video URL required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("videos").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      video_url: form.video_url.trim(),
      thumbnail_url: form.thumbnail_url.trim() || null,
      category_id: form.category_id || null,
      published: form.published,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Video added");
    setForm({ title: "", description: "", video_url: "", thumbnail_url: "", category_id: "", published: true });
    load();
  }

  async function togglePublished(id: string, published: boolean) {
    const { error } = await supabase.from("videos").update({ published: !published }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this video?")) return;
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Embed YouTube, Vimeo, or direct MP4 URLs.</p>
        </div>
        <Link to="/videos" className="inline-flex items-center gap-1 text-xs uppercase-track text-muted-foreground hover:text-gold">
          View page <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-8 rounded-sm border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Add new video</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input placeholder="Title" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Video URL (YouTube, Vimeo, MP4…)" value={form.video_url}
            onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          <textarea placeholder="Description (optional)" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="md:col-span-2 rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Thumbnail URL (optional)" value={form.thumbnail_url}
            onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          <select value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm">
            <option value="">— No category —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
            Published
          </label>
          <button onClick={add} disabled={saving}
            className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-sm bg-gradient-gold px-4 py-3 text-xs uppercase-track text-gold-foreground shadow-gold disabled:opacity-50">
            <Plus className="h-3 w-3" /> {saving ? "Saving…" : "Add video"}
          </button>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : videos.length === 0 ? (
          <p className="text-muted-foreground">No videos yet.</p>
        ) : videos.map((v) => (
          <div key={v.id} className="grid gap-4 rounded-sm border border-border bg-card p-4 md:grid-cols-[280px_1fr_auto]">
            <div><VideoEmbed url={v.video_url} title={v.title} /></div>
            <div>
              <h3 className="font-display text-lg font-semibold">{v.title}</h3>
              {v.categories && <p className="text-[10px] uppercase-track text-gold">{v.categories.name}</p>}
              {v.description && <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>}
              <p className="mt-1 break-all text-[10px] text-muted-foreground">{v.video_url}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => togglePublished(v.id, v.published)}
                className={`rounded-sm border px-3 py-1.5 text-[11px] uppercase-track ${v.published ? "border-gold/40 text-gold" : "border-border text-muted-foreground"}`}>
                {v.published ? "Published" : "Draft"}
              </button>
              <button onClick={() => remove(v.id)}
                className="inline-flex items-center justify-center gap-1 rounded-sm border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
