import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function NewsletterCta() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
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
    <section className="relative overflow-hidden rounded-sm border border-gold/20 bg-card px-6 py-16 sm:px-12 md:py-24">
      <div className="absolute inset-0 bg-gradient-overlay opacity-50" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mx-auto max-w-2xl text-center">
        <p className="uppercase-track text-xs text-gold">The Sunday Dispatch</p>
        <h2 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
          One essay. Every Sunday. <span className="text-gradient-gold">Nothing else.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Sharp ideas on becoming a more capable man. No clickbait. No spam. Unsubscribe in one click.
        </p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 rounded-sm border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-sm bg-gradient-gold px-6 py-3 text-xs uppercase-track text-gold-foreground shadow-gold transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? "Joining…" : "Join the dispatch"}
          </button>
        </form>
      </div>
    </section>
  );
}
