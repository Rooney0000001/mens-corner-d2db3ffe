import { getEmbedUrl } from "@/lib/videos";

export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const { type, src } = getEmbedUrl(url);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-black shadow-elevated">
      {type === "iframe" ? (
        <iframe
          src={src}
          title={title ?? "Video"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <video src={src} controls className="absolute inset-0 h-full w-full object-cover">
          <track kind="captions" />
        </video>
      )}
    </div>
  );
}
