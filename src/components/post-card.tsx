import { Link } from "@tanstack/react-router";
import type { PostWithCategory } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

interface Props {
  post: PostWithCategory;
  size?: "lg" | "md" | "sm";
}

export function PostCard({ post, size = "md" }: Props) {
  const sizes = {
    lg: { aspect: "aspect-[16/10]", title: "text-3xl md:text-4xl", excerpt: "text-base" },
    md: { aspect: "aspect-[4/3]", title: "text-xl md:text-2xl", excerpt: "text-sm" },
    sm: { aspect: "aspect-[16/10]", title: "text-base md:text-lg", excerpt: "text-xs" },
  }[size];

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group magazine-card block"
    >
      <div className={`relative overflow-hidden rounded-sm ${sizes.aspect} bg-muted`}>
        {post.cover_url ? (
          <img
            src={post.cover_url}
            alt={post.title}
            loading="lazy"
            className="img-luxury h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-overlay" />
        {post.categories && (
          <span className="absolute left-4 top-4 rounded-full border border-gold/50 bg-background/70 px-3 py-1 text-[10px] uppercase-track text-gold backdrop-blur">
            {post.categories.name}
          </span>
        )}
      </div>
      <div className="pt-5">
        <h3 className={`font-display ${sizes.title} font-semibold leading-tight text-foreground transition-colors group-hover:text-gold`}>
          {post.title}
        </h3>
        {post.excerpt && size !== "sm" && (
          <p className={`mt-3 ${sizes.excerpt} leading-relaxed text-muted-foreground line-clamp-2`}>
            {post.excerpt}
          </p>
        )}
        <div className="mt-4 flex items-center gap-3 text-[11px] uppercase-track text-muted-foreground">
          <span>{post.author_name ?? "Editorial"}</span>
          <span className="text-gold">·</span>
          <span>{formatDate(post.published_at ?? post.created_at)}</span>
          {post.reading_time && (
            <>
              <span className="text-gold">·</span>
              <span>{post.reading_time} min</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
