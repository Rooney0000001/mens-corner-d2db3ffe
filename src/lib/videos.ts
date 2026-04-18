import { supabase } from "@/integrations/supabase/client";
import type { CategoryRow } from "@/lib/posts";

export type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  published: boolean;
  position: number | null;
  created_at: string;
};

export type VideoWithCategory = VideoRow & { categories: CategoryRow | null };

export async function fetchPublishedVideos(): Promise<VideoWithCategory[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*, categories(*)")
    .eq("published", true)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VideoWithCategory[];
}

/**
 * Convert a YouTube/Vimeo URL into an embeddable URL.
 * Returns the original URL if it is already an embed or an MP4 file.
 */
export function getEmbedUrl(url: string): { type: "iframe" | "video"; src: string } {
  const trimmed = url.trim();

  // YouTube
  const yt =
    trimmed.match(/youtu\.be\/([\w-]{11})/) ||
    trimmed.match(/youtube\.com\/watch\?v=([\w-]{11})/) ||
    trimmed.match(/youtube\.com\/embed\/([\w-]{11})/) ||
    trimmed.match(/youtube\.com\/shorts\/([\w-]{11})/);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };

  // Vimeo
  const vm = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };

  // Direct file
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) return { type: "video", src: trimmed };

  // Fallback: try as iframe
  return { type: "iframe", src: trimmed };
}
