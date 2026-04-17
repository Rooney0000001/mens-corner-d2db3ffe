import { supabase } from "@/integrations/supabase/client";

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category_id: string | null;
  author_name: string | null;
  status: "draft" | "scheduled" | "published";
  featured: boolean;
  hero_position: number | null;
  reading_time: number | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
};

export type PostWithCategory = PostRow & { categories: CategoryRow | null };

export async function fetchPublishedPosts(limit = 50): Promise<PostWithCategory[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, categories(*)")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PostWithCategory[];
}

export async function fetchFeaturedPosts(): Promise<PostWithCategory[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, categories(*)")
    .eq("status", "published")
    .eq("featured", true)
    .order("hero_position", { ascending: true, nullsFirst: false })
    .limit(4);
  if (error) throw error;
  return (data ?? []) as PostWithCategory[];
}

export async function fetchPostBySlug(slug: string): Promise<PostWithCategory | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data as PostWithCategory | null;
}

export async function fetchRelatedPosts(categoryId: string | null, excludeId: string): Promise<PostWithCategory[]> {
  let q = supabase
    .from("posts")
    .select("*, categories(*)")
    .eq("status", "published")
    .neq("id", excludeId)
    .limit(3);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PostWithCategory[];
}

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CategoryRow[];
}

export async function fetchPostsByCategory(slug: string): Promise<{ category: CategoryRow | null; posts: PostWithCategory[] }> {
  const { data: cat, error: cerr } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (cerr) throw cerr;
  if (!cat) return { category: null, posts: [] };
  const { data, error } = await supabase
    .from("posts")
    .select("*, categories(*)")
    .eq("status", "published")
    .eq("category_id", cat.id)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return { category: cat as CategoryRow, posts: (data ?? []) as PostWithCategory[] };
}

export async function searchPosts(q: string): Promise<PostWithCategory[]> {
  const term = q.trim();
  if (!term) return [];
  const { data, error } = await supabase
    .from("posts")
    .select("*, categories(*)")
    .eq("status", "published")
    .or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,content.ilike.%${term}%`)
    .limit(30);
  if (error) throw error;
  return (data ?? []) as PostWithCategory[];
}
