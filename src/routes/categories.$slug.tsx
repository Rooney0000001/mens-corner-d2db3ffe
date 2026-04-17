import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchPostsByCategory, type PostWithCategory, type CategoryRow } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/categories/$slug")({
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-32 text-center">
      <h1 className="font-display text-4xl">Category not found</h1>
      <Link to="/categories" className="mt-6 inline-block text-xs uppercase-track text-gold">← All categories</Link>
    </div>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<CategoryRow | null>(null);
  const [posts, setPosts] = useState<PostWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetchPostsByCategory(slug).then(({ category, posts }) => {
      if (!category) { setMissing(true); return; }
      setCat(category);
      setPosts(posts);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (missing) throw notFound();
  if (loading || !cat) return <div className="mx-auto max-w-7xl px-5 py-20"><div className="h-12 w-1/2 animate-pulse rounded bg-muted" /></div>;

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Link to="/categories" className="inline-flex items-center gap-2 text-xs uppercase-track text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-3 w-3" /> All categories
      </Link>
      <div className="mt-6 max-w-3xl">
        <p className="uppercase-track text-xs text-gold">Category</p>
        <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">{cat.name}</h1>
        {cat.description && <p className="mt-4 text-lg text-muted-foreground">{cat.description}</p>}
      </div>
      <div className="gold-divider my-12" />
      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground">No essays in this category yet.</p>
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
