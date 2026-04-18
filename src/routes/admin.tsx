import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, FileText, FolderTree, Mail, Users, Settings, LogOut, ArrowLeft, Video, UserPlus } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; adminOnly?: boolean };
const NAV: readonly NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/posts", label: "Posts", icon: FileText },
  { to: "/admin/videos", label: "Videos", icon: Video },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/subscribers", label: "Subscribers", icon: Users },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/team", label: "Team", icon: UserPlus, adminOnly: true },
  { to: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

function AdminLayout() {
  const { user, isEditor, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (!loading && user && !isEditor) navigate({ to: "/" });
  }, [user, isEditor, loading, navigate]);

  if (loading || !user || !isEditor) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
        <Link to="/" className="block border-b border-border px-6 py-5 font-display text-xl font-bold">
          Men's <span className="text-gradient-gold">Corner</span>
        </Link>
        <nav className="flex-1 px-3 py-6">
          {NAV.filter((n) => isAdmin || !n.adminOnly).map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`mb-1 flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
                  active ? "bg-gold/10 text-gold" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-[10px] uppercase-track text-gold">{isAdmin ? "Admin" : "Editor"}</p>
          <div className="mt-3 flex gap-2">
            <Link to="/" className="flex-1 inline-flex items-center justify-center gap-1 rounded-sm border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:text-gold">
              <ArrowLeft className="h-3 w-3" /> Site
            </Link>
            <button onClick={() => { signOut(); navigate({ to: "/" }); }}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-sm border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:text-destructive">
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        {/* Mobile nav */}
        <div className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-border bg-background/90 px-3 py-2 backdrop-blur md:hidden">
          {NAV.filter((n) => isAdmin || !n.adminOnly).map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-xs ${active ? "bg-gold/10 text-gold" : "text-muted-foreground"}`}>
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="p-6 md:p-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
