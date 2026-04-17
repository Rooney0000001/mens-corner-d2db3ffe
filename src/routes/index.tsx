import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchFeaturedPosts, fetchPublishedPosts, fetchCategories, type PostWithCategory, type CategoryRow } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { NewsletterCta } from "@/components/newsletter-cta";
import { ArrowRight, Brain, TrendingUp, Dumbbell, Compass, Watch, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";

const CAT_ICONS: Record<string, typeof Brain> = {
  Brain, TrendingUp, Dumbbell, Compass, Watch, BookOpen,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Men's Corner — A Publication for the Modern Man" },
      { name: "description", content: "Premium essays on mindset, finance, fitness, and purpose. Sharp ideas, no noise." },
      { property: "og:title", content: "Men's Corner — A Publication for the Modern Man" },
      { property: "og:description", content: "Premium essays on mindset, finance, fitness, and purpose." },
      { property: "og:image", content: "/seed/hero-mindset.jpg" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [featured, setFeatured] = useState<PostWithCategory[]>([]);
  const [latest, setLatest] = useState<PostWithCategory[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchFeaturedPosts(), fetchPublishedPosts(20), fetchCategories()])
      .then(([f, l, c]) => { setFeatured(f); setLatest(l); setCats(c); })
      .finally(() => setLoading(false));
  }, []);

  const hero = featured[0];
  const sides = featured.slice(1, 4);
  const featuredIds = new Set(featured.map((f) => f.id));
  const latestGrid = latest.filter((p) => !featuredIds.has(p.id)).slice(0, 6);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      {/* Top brand strip */}
      <div className="flex items-center justify-between border-b border-border/60 py-5 text-[10px] uppercase-track text-muted-foreground">
        <span>Issue No. 01 · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        <span className="hidden sm:inline">For the man who is becoming</span>
      </div>

      {/* Hero */}
      <section className="grid gap-8 py-10 lg:grid-cols-3 lg:gap-10 lg:py-14">
        {hero ? (
          <Link
            to="/blog/$slug"
            params={{ slug: hero.slug }}
            className="group magazine-card lg:col-span-2"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-muted">
              {hero.cover_url && (
                <img src={hero.cover_url} alt={hero.title} className="img-luxury h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-overlay" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                {hero.categories && (
                  <span className="inline-block rounded-full border border-gold/50 bg-background/70 px-3 py-1 text-[10px] uppercase-track text-gold backdrop-blur">
                    {hero.categories.name}
                  </span>
                )}
                <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] text-cream md:text-6xl group-hover:text-gold transition-colors">
                  {hero.title}
                </h1>
                {hero.excerpt && (
                  <p className="mt-4 max-w-2xl text-base text-cream/80 md:text-lg">{hero.excerpt}</p>
                )}
                <div className="mt-5 flex items-center gap-3 text-[11px] uppercase-track text-cream/70">
                  <span>{hero.author_name}</span>
                  <span className="text-gold">·</span>
                  <span>{formatDate(hero.published_at ?? hero.created_at)}</span>
                  <span className="text-gold">·</span>
                  <span>{hero.reading_time} min read</span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="lg:col-span-2 rounded-sm border border-border bg-card p-12 text-center text-muted-foreground">
            No featured post yet. Add one in the admin.
          </div>
        )}

        <div className="flex flex-col gap-6">
          {sides.length > 0 ? sides.map((p) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group flex gap-4 magazine-card"
            >
              <div className="relative aspect-square w-28 flex-shrink-0 overflow-hidden rounded-sm bg-muted sm:w-32">
                {p.cover_url && (
                  <img src={p.cover_url} alt={p.title} loading="lazy" className="img-luxury h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-col justify-center">
                {p.categories && (
                  <span className="text-[10px] uppercase-track text-gold">{p.categories.name}</span>
                )}
                <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-gold sm:text-xl">
                  {p.title}
                </h3>
                <span className="mt-2 text-[11px] uppercase-track text-muted-foreground">
                  {formatDate(p.published_at ?? p.created_at)}
                </span>
              </div>
            </Link>
          )) : (
            <div className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
              Mark posts as featured in the admin to populate this column.
            </div>
          )}
        </div>
      </section>

      <div className="gold-divider my-6" />

      {/* Latest */}
      <section className="py-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="uppercase-track text-xs text-gold">Latest essays</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Recent dispatches</h2>
          </div>
          <Link to="/categories" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase-track text-muted-foreground hover:text-gold">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {latestGrid.length === 0 ? (
          <div className="rounded-sm border border-border bg-card p-12 text-center text-muted-foreground">
            No more posts to show. Create one in the admin.
          </div>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {latestGrid.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="mb-10 text-center">
          <p className="uppercase-track text-xs text-gold">Pillars</p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Choose your domain</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cats.map((c) => {
            const Icon = CAT_ICONS[c.icon ?? "Compass"] ?? Compass;
            return (
              <Link
                key={c.id}
                to="/categories/$slug"
                params={{ slug: c.slug }}
                className="group flex flex-col items-center justify-center gap-3 rounded-sm border border-border bg-card p-8 text-center transition-all hover:border-gold/60 hover:shadow-gold"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-background transition-colors group-hover:border-gold">
                  <Icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-display text-lg font-semibold transition-colors group-hover:text-gold">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{c.description}</p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12">
        <NewsletterCta />
      </section>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 aspect-[16/10] animate-pulse rounded-sm bg-muted" />
        <div className="space-y-4">
          {[0,1,2].map(i => <div key={i} className="h-28 animate-pulse rounded-sm bg-muted" />)}
        </div>
      </div>
    </div>
  );
}
