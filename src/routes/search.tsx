import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { searchPosts, type PostWithCategory } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { Search } from "lucide-react";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) ?? "" }),
  head: () => ({
    meta: [
      { title: "Search — Men's Corner" },
      { name: "description", content: "Search essays across mindset, finance, fitness, and purpose." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(q);
  const [results, setResults] = useState<PostWithCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setTerm(q); }, [q]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    searchPosts(q).then(setResults).finally(() => setLoading(false));
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: { q: term.trim() } });
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="uppercase-track text-xs text-gold">Library</p>
        <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Search</h1>
        <form onSubmit={submit} className="mt-8 flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-3 focus-within:border-gold">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search essays…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button type="submit" className="rounded-sm bg-gradient-gold px-4 py-1.5 text-xs uppercase-track text-gold-foreground">
            Search
          </button>
        </form>
      </div>

      <div className="mt-16">
        {loading && <p className="text-center text-muted-foreground">Searching…</p>}
        {!loading && q && results.length === 0 && (
          <p className="text-center text-muted-foreground">No essays found for "{q}".</p>
        )}
        {!loading && results.length > 0 && (
          <>
            <p className="mb-8 text-xs uppercase-track text-muted-foreground">{results.length} {results.length === 1 ? "result" : "results"}</p>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
