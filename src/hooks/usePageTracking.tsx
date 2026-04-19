import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Records a page view in the `page_views` table on every route change.
 * Skips admin/auth routes and de-duplicates rapid repeats of the same path.
 */
export function usePageTracking() {
  const { location } = useRouterState();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (!path) return;
    if (path.startsWith("/admin") || path === "/auth") return;
    if (lastPath.current === path) return;
    lastPath.current = path;

    const referrer = typeof document !== "undefined" ? document.referrer || null : null;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null;

    supabase.from("page_views").insert({
      path: path.slice(0, 500),
      referrer: referrer?.slice(0, 500) ?? null,
      user_agent: ua,
    }).then(() => { /* fire and forget */ });
  }, [location.pathname]);
}

/** Records a read on a specific post (in addition to the page view). */
export function trackPostRead(postId: string, slug: string) {
  supabase.from("page_views").insert({
    path: `/blog/${slug}`.slice(0, 500),
    post_id: postId,
    referrer: typeof document !== "undefined" ? (document.referrer || null) : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
  }).then(() => { /* fire and forget */ });
}
