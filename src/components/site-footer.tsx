import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/mens-corner-logo.png";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("subscribers").insert({ email: email.trim().toLowerCase() });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("You're already subscribed.");
      else toast.error("Could not subscribe. Try again.");
      return;
    }
    setEmail("");
    toast.success("Welcome to the inner circle.");
  }

  return (
    <footer className="mt-32 border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Men's Corner" className="h-14 w-14 object-contain" />
              <span className="font-display text-2xl font-bold">
                Men's <span className="text-gradient-gold">Corner</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              A premium publication for the modern man. Mindset, finance, fitness, purpose.
            </p>
          </div>

          <div>
            <h4 className="uppercase-track text-xs text-gold">Explore</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-gold">Home</Link></li>
              <li><Link to="/categories" className="hover:text-gold">Categories</Link></li>
              <li><Link to="/about" className="hover:text-gold">About</Link></li>
              <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
              <li><Link to="/search" search={{ q: "" }} className="hover:text-gold">Search</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="uppercase-track text-xs text-gold">The dispatch</h4>
            <p className="mt-4 text-sm text-muted-foreground">
              One essay every Sunday. No noise, no spam.
            </p>
            <form onSubmit={subscribe} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-sm border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-sm bg-gradient-gold px-4 py-2 text-xs uppercase-track text-gold-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 gold-divider" />
        <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Men's Corner. All rights reserved.</p>
          <p>Crafted with discipline.</p>
        </div>
      </div>
    </footer>
  );
}
