import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Men's Corner" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ invite: typeof s.invite === "string" ? s.invite : undefined }),
  component: AuthPage,
});

function AuthPage() {
  const { invite } = Route.useSearch();
  const isInvite = !!invite;

  const [mode, setMode] = useState<"signin" | "signup">(isInvite ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState<null | boolean>(null);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isEditor, loading: authLoading } = useAuth();

  // Validate invite on mount
  useEffect(() => {
    if (!invite) return;
    supabase.rpc("validate_invite", { _token: invite }).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) { setInviteValid(false); return; }
      setInviteValid(!!row.valid);
      setInviteRole(row.role);
    });
  }, [invite]);

  useEffect(() => {
    if (!authLoading && user && !isInvite) navigate({ to: isEditor ? "/admin" : "/" });
  }, [user, isEditor, authLoading, navigate, isInvite]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      if (!invite || inviteValid === false) {
        toast.error("A valid invite link is required to create an account.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      if (error) { toast.error(error.message); setLoading(false); return; }
      const userId = data.user?.id;
      if (userId && invite) {
        const { data: ok, error: rerr } = await supabase.rpc("redeem_invite", { _token: invite, _user_id: userId });
        if (rerr || !ok) {
          toast.error("Invite could not be redeemed.");
        } else {
          toast.success("Account created. Welcome.");
        }
      }
      setLoading(false);
      // Auto sign-in if session is present, otherwise prompt
      if (!data.session) {
        toast.info("Please sign in with your new credentials.");
        setMode("signin");
      } else {
        navigate({ to: "/admin" });
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center font-display text-3xl font-bold">
          Men's <span className="text-gradient-gold">Corner</span>
        </Link>
        <div className="mt-8 rounded-sm border border-border bg-card p-8 shadow-elevated">
          <h1 className="font-display text-2xl font-semibold">{mode === "signup" ? "Accept invitation" : "Sign in"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? inviteValid === false
                ? "This invite link is invalid or expired."
                : `You're being invited as ${inviteRole ?? "a team member"}. Set your credentials below.`
              : "Access the editorial dashboard. Invite-only."}
          </p>

          {!(mode === "signup" && inviteValid === false) && (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs uppercase-track text-muted-foreground">Display name</label>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none" />
                </div>
              )}
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
              <button type="submit" disabled={loading || (mode === "signup" && inviteValid === null)}
                className="w-full rounded-sm bg-gradient-gold px-4 py-3 text-xs uppercase-track text-gold-foreground shadow-gold disabled:opacity-50">
                {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
          )}

          {!isInvite && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              New accounts are created by invitation only.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
