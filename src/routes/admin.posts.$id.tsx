import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify, readingTime } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, ArrowLeft } from "lucide-react";

type Cat = { id: string; name: string };
type Form = {
  title: string; slug: string; excerpt: string; content: string;
  cover_url: string; video_url: string; category_id: string;
  status: "draft" | "scheduled" | "published"; featured: boolean;
  hero_position: number | null; scheduled_at: string;
};

const empty: Form = { title: "", slug: "", excerpt: "", content: "", cover_url: "", video_url: "", category_id: "", status: "draft", featured: false, hero_position: null, scheduled_at: "" };

export const Route = createFileRoute("/admin/posts/$id")({
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(empty);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name").order("name").then(({ data }) => setCats((data ?? []) as Cat[]));
    if (!isNew) {
      supabase.from("posts").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
        if (error || !data) { toast.error("Post not found"); navigate({ to: "/admin/posts" }); return; }
        setForm({
          title: data.title, slug: data.slug, excerpt: data.excerpt ?? "", content: data.content,
          cover_url: data.cover_url ?? "", video_url: (data as { video_url: string | null }).video_url ?? "",
          category_id: data.category_id ?? "",
          status: data.status, featured: data.featured, hero_position: data.hero_position,
          scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : "",
        });
        setLoading(false);
      });
    }
  }, [id, isNew, navigate]);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    set("cover_url", data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  }

  async function save() {
    if (!form.title.trim() || !form.content.trim()) { toast.error("Title and content required"); return; }
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.title);
    const payload = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_url: form.cover_url || null,
      video_url: form.video_url.trim() || null,
      category_id: form.category_id || null,
      status: form.status,
      featured: form.featured,
      hero_position: form.hero_position,
      reading_time: readingTime(form.content),
      scheduled_at: form.status === "scheduled" && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      published_at: form.status === "published" ? new Date().toISOString() : null,
      author_id: user?.id ?? null,
      author_name: user?.email?.split("@")[0] ?? "Editorial",
    };
    let error;
    if (isNew) {
      ({ error } = await supabase.from("posts").insert(payload));
    } else {
      ({ error } = await supabase.from("posts").update(payload).eq("id", id));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    navigate({ to: "/admin/posts" });
  }

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-4xl">
      <Link to="/admin/posts" className="inline-flex items-center gap-2 text-xs uppercase-track text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-3 w-3" /> Back to posts
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">{isNew ? "New post" : "Edit post"}</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Field label="Title">
            <input value={form.title} onChange={(e) => { set("title", e.target.value); if (isNew && !form.slug) set("slug", slugify(e.target.value)); }}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-lg" />
          </Field>
          <Field label="Slug">
            <input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-mono" />
          </Field>
          <Field label="Excerpt">
            <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Content (Markdown supported: ## h2, ### h3, > quote, - list, **bold**)">
            <textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={20}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-sm" />
          </Field>
        </div>

        <aside className="space-y-5">
          <Field label="Cover image">
            {form.cover_url && <img src={form.cover_url} alt="" className="mb-2 aspect-video w-full rounded-sm object-cover" />}
            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-background px-3 py-3 text-xs uppercase-track text-muted-foreground hover:border-gold hover:text-gold">
              <Upload className="h-3 w-3" /> {uploading ? "Uploading…" : "Upload image"}
              <input type="file" accept="image/*" onChange={upload} className="hidden" disabled={uploading} />
            </label>
            <input value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="or paste URL"
              className="mt-2 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs" />
          </Field>

          <Field label="Video URL (optional, replaces cover image)">
            <input value={form.video_url} onChange={(e) => set("video_url", e.target.value)}
              placeholder="YouTube, Vimeo, or .mp4 URL"
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          </Field>

          <Field label="Category">
            <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm">
              <option value="">— None —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value as Form["status"])}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </Field>

          {form.status === "scheduled" && (
            <Field label="Publish at">
              <input type="datetime-local" value={form.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
            </Field>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
            Featured on homepage
          </label>

          {form.featured && (
            <Field label="Hero position (1 = main, 2-4 = side)">
              <input type="number" min={1} max={4} value={form.hero_position ?? ""} onChange={(e) => set("hero_position", e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
            </Field>
          )}

          <button onClick={save} disabled={saving}
            className="w-full rounded-sm bg-gradient-gold px-4 py-3 text-xs uppercase-track text-gold-foreground shadow-gold disabled:opacity-50">
            {saving ? "Saving…" : "Save post"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase-track text-muted-foreground">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
