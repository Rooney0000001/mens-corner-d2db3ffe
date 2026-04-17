import { Link } from "@tanstack/react-router";
import { Search, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isEditor } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="group flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-2xl font-bold tracking-tight">
            Men's <span className="text-gradient-gold">Corner</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="uppercase-track text-xs text-muted-foreground transition-colors hover:text-gold"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-gold"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Link>
          {user ? (
            isEditor ? (
              <Link
                to="/admin"
                className="hidden md:inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-xs uppercase-track text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
              >
                <User className="h-3.5 w-3.5" /> Admin
              </Link>
            ) : null
          ) : (
            <Link
              to="/auth"
              className="hidden md:inline-flex items-center rounded-full border border-gold/40 px-4 py-2 text-xs uppercase-track text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
            >
              Sign in
            </Link>
          )}
          <button
            className="md:hidden rounded-full p-2 text-muted-foreground hover:text-gold"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border/60 bg-background/95 px-5 py-6">
          <div className="flex flex-col gap-4">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="uppercase-track text-sm text-foreground hover:text-gold"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            {user && isEditor && (
              <Link to="/admin" className="uppercase-track text-sm text-gold" onClick={() => setOpen(false)}>
                Admin
              </Link>
            )}
            {!user && (
              <Link to="/auth" className="uppercase-track text-sm text-gold" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
