import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchCategories, type CategoryRow } from "@/lib/posts";
import { Brain, TrendingUp, Dumbbell, Compass, Watch, BookOpen } from "lucide-react";

const ICONS: Record<string, typeof Brain> = { Brain, TrendingUp, Dumbbell, Compass, Watch, BookOpen };

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "Categories — Men's Corner" },
      { name: "description", content: "Browse essays by pillar: mindset, finance, fitness, purpose, and style." },
      { property: "og:title", content: "Categories — Men's Corner" },
      { property: "og:description", content: "Browse essays by pillar: mindset, finance, fitness, purpose, and style." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [cats, setCats] = useState<CategoryRow[]>([]);
  useEffect(() => { fetchCategories().then(setCats); }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="text-center">
        <p className="uppercase-track text-xs text-gold">The pillars</p>
        <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Categories</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Five domains of a serious life. Pick one to begin.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => {
          const Icon = ICONS[c.icon ?? "Compass"] ?? Compass;
          return (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="group flex flex-col gap-4 rounded-sm border border-border bg-card p-8 transition-all hover:border-gold/60 hover:shadow-gold"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-background">
                <Icon className="h-6 w-6 text-gold" />
              </div>
              <h2 className="font-display text-2xl font-semibold transition-colors group-hover:text-gold">{c.name}</h2>
              {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              <span className="mt-auto text-xs uppercase-track text-gold opacity-0 transition-opacity group-hover:opacity-100">Read essays →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
