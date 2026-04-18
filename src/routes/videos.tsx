import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchPublishedVideos, type VideoWithCategory } from "@/lib/videos";
import { VideoEmbed } from "@/components/video-embed";
import { NewsletterCta } from "@/components/newsletter-cta";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Videos — Men's Corner" },
      { name: "description", content: "Watch the latest videos from Men's Corner — essays, interviews, and films." },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const [videos, setVideos] = useState<VideoWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedVideos().then(setVideos).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <header className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="uppercase-track text-xs text-gold">The Film Room</p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-tight md:text-7xl">
          <span className="text-gradient-gold">Videos</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Watch, reflect, refine. Curated essays and conversations on the craft of being a man.
        </p>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        {loading ? (
          <div className="grid gap-8 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-video animate-pulse rounded-sm bg-muted" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <p className="text-center text-muted-foreground">No videos yet. Check back soon.</p>
        ) : (
          <div className="grid gap-10 md:grid-cols-2">
            {videos.map((v) => (
              <article key={v.id} className="space-y-4">
                <VideoEmbed url={v.video_url} title={v.title} />
                <div>
                  {v.categories && (
                    <span className="text-[10px] uppercase-track text-gold">{v.categories.name}</span>
                  )}
                  <h2 className="mt-1 font-display text-2xl font-semibold">{v.title}</h2>
                  {v.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <NewsletterCta />
    </div>
  );
}
