import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE_URL = "https://mens-corner.lovable.app";

const STATIC_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/categories", changefreq: "weekly", priority: "0.7" },
  { path: "/videos", changefreq: "weekly", priority: "0.7" },
  { path: "/search", changefreq: "monthly", priority: "0.3" },
];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]!));
}

function urlEntry(loc: string, lastmod?: string | null, changefreq = "weekly", priority = "0.6") {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `
    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [posts, categories, videos] = await Promise.all([
          supabaseAdmin
            .from("posts")
            .select("slug, updated_at, published_at")
            .eq("status", "published")
            .order("published_at", { ascending: false }),
          supabaseAdmin.from("categories").select("slug, created_at"),
          supabaseAdmin.from("videos").select("id, updated_at").eq("published", true),
        ]);

        const entries: string[] = [];

        for (const r of STATIC_ROUTES) {
          entries.push(urlEntry(`${SITE_URL}${r.path}`, null, r.changefreq, r.priority));
        }

        for (const p of posts.data ?? []) {
          entries.push(
            urlEntry(`${SITE_URL}/blog/${p.slug}`, p.updated_at ?? p.published_at, "weekly", "0.8"),
          );
        }

        for (const c of categories.data ?? []) {
          entries.push(
            urlEntry(`${SITE_URL}/categories/${c.slug}`, c.created_at, "weekly", "0.6"),
          );
        }

        // Single videos index page is already in STATIC_ROUTES; include lastmod from latest video
        const latestVideoUpdate = (videos.data ?? [])
          .map((v) => v.updated_at)
          .sort()
          .pop();
        if (latestVideoUpdate) {
          entries.push(urlEntry(`${SITE_URL}/videos`, latestVideoUpdate, "weekly", "0.7"));
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
