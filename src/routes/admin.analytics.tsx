import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, FileText, MousePointerClick, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

type Row = { path: string; created_at: string; post_id: string | null };
type PostMeta = { id: string; title: string; slug: string };

function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<Row[]>([]);
  const [postsMeta, setPostsMeta] = useState<Record<string, PostMeta>>({});

  useEffect(() => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    Promise.all([
      supabase.from("page_views").select("path, created_at, post_id").gte("created_at", since).order("created_at", { ascending: false }).limit(10000),
      supabase.from("posts").select("id, title, slug"),
    ]).then(([v, p]) => {
      setRows((v.data ?? []) as Row[]);
      const map: Record<string, PostMeta> = {};
      (p.data ?? []).forEach((r: any) => { map[r.id] = r; });
      setPostsMeta(map);
    }).finally(() => setLoading(false));
  }, [days]);

  const total = rows.length;
  const homeViews = rows.filter((r) => r.path === "/").length;
  const articleReads = rows.filter((r) => r.post_id).length;
  const uniquePaths = new Set(rows.map((r) => r.path)).size;

  // Per-post counts
  const postCounts = new Map<string, number>();
  rows.forEach((r) => {
    if (!r.post_id) return;
    postCounts.set(r.post_id, (postCounts.get(r.post_id) ?? 0) + 1);
  });
  const topPosts = Array.from(postCounts.entries())
    .map(([id, count]) => ({ id, count, meta: postsMeta[id] }))
    .filter((p) => p.meta)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Per-path counts
  const pathCounts = new Map<string, number>();
  rows.forEach((r) => pathCounts.set(r.path, (pathCounts.get(r.path) ?? 0) + 1));
  const topPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Daily series for the last N days
  const series: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, count: 0 });
  }
  rows.forEach((r) => {
    const key = r.created_at.slice(0, 10);
    const item = series.find((s) => s.day === key);
    if (item) item.count++;
  });
  const max = Math.max(1, ...series.map((s) => s.count));

  const cards = [
    { label: "Total visits", value: total, icon: Eye },
    { label: "Article reads", value: articleReads, icon: FileText },
    { label: "Homepage clicks", value: homeViews, icon: MousePointerClick },
    { label: "Unique pages", value: uniquePaths, icon: TrendingUp },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visitors and article reads on your site.</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-9 rounded-sm border border-border bg-background px-3 text-xs"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-sm border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase-track text-muted-foreground">{c.label}</p>
                  <c.icon className="h-4 w-4 text-gold" />
                </div>
                <p className="mt-3 font-display text-4xl font-bold text-cream">{c.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Daily chart */}
          <div className="mt-10 rounded-sm border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Visits per day</h2>
            <div className="mt-6 flex h-48 items-end gap-1">
              {series.map((s) => (
                <div key={s.day} className="group relative flex-1" title={`${s.day}: ${s.count}`}>
                  <div
                    className="w-full rounded-t-sm bg-gradient-gold transition-opacity hover:opacity-80"
                    style={{ height: `${(s.count / max) * 100}%`, minHeight: s.count > 0 ? "2px" : "0" }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{series[0]?.day}</span>
              <span>{series[series.length - 1]?.day}</span>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Top articles</h2>
              {topPosts.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No article reads yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {topPosts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-4 py-2.5">
                      <a href={`/blog/${p.meta.slug}`} target="_blank" rel="noreferrer" className="truncate text-sm hover:text-gold">
                        {p.meta.title}
                      </a>
                      <span className="shrink-0 font-display text-sm text-gold">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Top pages</h2>
              <ul className="mt-4 divide-y divide-border">
                {topPaths.map(([path, count]) => (
                  <li key={path} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="truncate font-mono text-xs text-muted-foreground">{path}</span>
                    <span className="shrink-0 font-display text-sm text-gold">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
