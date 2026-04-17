import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Men's Corner" }] }),
  component: AuthPage,
});

function AuthPage() {
  const mode = "signin" as const;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isEditor, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate({ to: isEditor ? "/admin" : "/" });
  }, [user, isEditor, authLoading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Account created. You're signed in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Welcome back.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center font-display text-3xl font-bold">
          Men's <span className="text-gradient-gold">Corner</span>
        </Link>
        <div className="mt-8 rounded-sm border border-border bg-card p-8 shadow-elevated">
          <h1 className="font-display text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Access the editorial dashboard. Invite-only.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs uppercase-track text-muted-foreground">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs uppercase-track text-muted-foreground">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-sm bg-gradient-gold px-4 py-3 text-xs uppercase-track text-gold-foreground shadow-gold disabled:opacity-50">
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            New accounts are created by invitation only.
          </p>
        </div>
      </div>
    </div>
  );
}
