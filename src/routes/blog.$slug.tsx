import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { fetchPostBySlug, fetchRelatedPosts, type PostWithCategory } from "@/lib/posts";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/utils";
import { PostCard } from "@/components/post-card";
import { VideoEmbed } from "@/components/video-embed";
import { NewsletterCta } from "@/components/newsletter-cta";
import { ArrowLeft, Clock, Twitter, Facebook, MessageCircle, BookOpen } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-32 text-center">
      <h1 className="font-display text-5xl text-gradient-gold">Not found</h1>
      <p className="mt-4 text-muted-foreground">This essay doesn't exist or has been unpublished.</p>
      <Link to="/" className="mt-8 inline-block text-xs uppercase-track text-gold">← Back to home</Link>
    </div>
  ),
});

function renderMarkdown(md: string): string {
  // Minimal safe markdown: headings, bold, lists, blockquotes, paragraphs
  const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  const lines = md.split("\n");
  let html = "";
  let inList: "ul" | "ol" | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      let p = escape(para.join(" "));
      p = p.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      p = p.replace(/\*(.+?)\*/g, "<em>$1</em>");
      html += `<p>${p}</p>`;
      para = [];
    }
  };
  const closeList = () => { if (inList) { html += `</${inList}>`; inList = null; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); closeList(); continue; }
    if (line.startsWith("### ")) { flushPara(); closeList(); html += `<h3>${escape(line.slice(4))}</h3>`; continue; }
    if (line.startsWith("## ")) { flushPara(); closeList(); html += `<h2>${escape(line.slice(3))}</h2>`; continue; }
    if (line.startsWith("> ")) { flushPara(); closeList(); html += `<blockquote>${escape(line.slice(2))}</blockquote>`; continue; }
    if (line.startsWith("- ")) {
      flushPara();
      if (inList !== "ul") { closeList(); html += "<ul>"; inList = "ul"; }
      let li = escape(line.slice(2)).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html += `<li>${li}</li>`;
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      flushPara();
      if (inList !== "ol") { closeList(); html += "<ol>"; inList = "ol"; }
      let li = escape(line.replace(/^\d+\.\s/, "")).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html += `<li>${li}</li>`;
      continue;
    }
    closeList();
    para.push(line);
  }
  flushPara(); closeList();
  return html;
}

// Render the post content. New posts are HTML from the rich text editor;
// legacy posts may be plain markdown — auto-detect and convert.
function renderContent(content: string): string {
  const looksLikeHtml = /<\/?(p|h[1-6]|ul|ol|li|blockquote|strong|em|img|a|span|div|br)\b/i.test(content);
  const html = looksLikeHtml ? content : renderMarkdown(content);
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "rel", "style"],
  });
}

function PostPage() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<PostWithCategory | null>(null);
  const [related, setRelated] = useState<PostWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [ebook, setEbook] = useState<{ url?: string; title?: string }>({});

  useEffect(() => {
    setLoading(true);
    fetchPostBySlug(slug).then(async (p) => {
      setPost(p);
      if (p) {
        const r = await fetchRelatedPosts(p.category_id, p.id);
        setRelated(r);
      }
    }).finally(() => setLoading(false));

    supabase.from("site_settings").select("key,value").in("key", ["ebook_url", "ebook_title"]).then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((r) => { if (r.value) m[r.key] = r.value; });
      setEbook({ url: m.ebook_url, title: m.ebook_title });
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-12 w-full animate-pulse rounded bg-muted" />
        <div className="mt-10 aspect-[16/10] w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (!post) throw notFound();

  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(url);

  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase-track text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-3 w-3" /> Back to home
      </Link>

      <header className="mt-8 text-center">
        {post.categories && (
          <Link
            to="/categories/$slug"
            params={{ slug: post.categories.slug }}
            className="inline-block rounded-full border border-gold/40 px-4 py-1 text-[10px] uppercase-track text-gold"
          >
            {post.categories.name}
          </Link>
        )}
        <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] text-cream md:text-6xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="mt-8 flex items-center justify-center gap-4 text-[11px] uppercase-track text-muted-foreground">
          <span>{post.author_name ?? "Editorial"}</span>
          <span className="text-gold">·</span>
          <span>{formatDate(post.published_at ?? post.created_at)}</span>
          <span className="text-gold">·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.reading_time} min</span>
        </div>
      </header>

      {post.video_url ? (
        <div className="my-12">
          <VideoEmbed url={post.video_url} title={post.title} />
        </div>
      ) : post.cover_url ? (
        <div className="my-12 overflow-hidden rounded-sm shadow-elevated">
          <img src={post.cover_url} alt={post.title} className="aspect-[16/10] w-full object-cover" />
        </div>
      ) : null}

      <div className="prose-luxury" dangerouslySetInnerHTML={{ __html: renderContent(post.content) }} />

      {/* Share */}
      <div className="mt-12 flex flex-col items-center gap-4 border-y border-border py-8">
        <p className="uppercase-track text-xs text-gold">Share this essay</p>
        <div className="flex gap-3">
          <a
            href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
            target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
            target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            aria-label="Share on Twitter"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            aria-label="Share on Facebook"
          >
            <Facebook className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* eBook CTA */}
      {ebook.url && (
        <aside className="mt-12 overflow-hidden rounded-sm border border-gold/30 bg-card p-8 shadow-gold">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold">
              <BookOpen className="h-7 w-7 text-gold-foreground" />
            </div>
            <div className="flex-1">
              <p className="uppercase-track text-xs text-gold">From the editor</p>
              <h3 className="mt-1 font-display text-xl font-semibold">{ebook.title ?? "Get the eBook"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">A field manual for the man who refuses to drift.</p>
            </div>
            <a
              href={ebook.url}
              target="_blank" rel="noopener noreferrer"
              className="rounded-sm bg-gradient-gold px-5 py-3 text-xs uppercase-track text-gold-foreground"
            >
              Buy eBook
            </a>
          </div>
        </aside>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20">
          <p className="uppercase-track text-xs text-gold">Continue reading</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Related essays</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {related.map((p) => <PostCard key={p.id} post={p} size="sm" />)}
          </div>
        </section>
      )}

      {/* Newsletter CTA at end of article */}
      <div className="mt-20 -mx-5 sm:-mx-8">
        <NewsletterCta />
      </div>
    </article>
  );
}
