import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Mail, FolderTree } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({ posts: 0, drafts: 0, subscribers: 0, messages: 0, categories: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("subscribers").select("*", { count: "exact", head: true }),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("read", false),
      supabase.from("categories").select("*", { count: "exact", head: true }),
    ]).then(([p, d, s, m, c]) => {
      setStats({ posts: p.count ?? 0, drafts: d.count ?? 0, subscribers: s.count ?? 0, messages: m.count ?? 0, categories: c.count ?? 0 });
    });
  }, []);

  const cards = [
    { label: "Published posts", value: stats.posts, icon: FileText, to: "/admin/posts" },
    { label: "Drafts", value: stats.drafts, icon: FileText, to: "/admin/posts" },
    { label: "Categories", value: stats.categories, icon: FolderTree, to: "/admin/categories" },
    { label: "Subscribers", value: stats.subscribers, icon: Users, to: "/admin/subscribers" },
    { label: "New messages", value: stats.messages, icon: Mail, to: "/admin/messages" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back. Here's the state of the publication.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="group rounded-sm border border-border bg-card p-6 transition-all hover:border-gold/60 hover:shadow-gold">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase-track text-muted-foreground">{c.label}</p>
              <c.icon className="h-4 w-4 text-gold" />
            </div>
            <p className="mt-3 font-display text-4xl font-bold text-cream">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-10 rounded-sm border border-gold/30 bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/posts/$id" params={{ id: "new" }} className="rounded-sm bg-gradient-gold px-4 py-2 text-xs uppercase-track text-gold-foreground">+ New post</Link>
          <Link to="/admin/categories" className="rounded-sm border border-border px-4 py-2 text-xs uppercase-track">Manage categories</Link>
          <Link to="/admin/subscribers" className="rounded-sm border border-border px-4 py-2 text-xs uppercase-track">Export subscribers</Link>
        </div>
      </div>
    </div>
  );
}
