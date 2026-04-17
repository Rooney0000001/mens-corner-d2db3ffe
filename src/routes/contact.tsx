import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Men's Corner" },
      { name: "description", content: "Get in touch with the editorial team at Men's Corner." },
      { property: "og:title", content: "Contact — Men's Corner" },
      { property: "og:description", content: "Get in touch with the editorial team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [contactEmail, setContactEmail] = useState<string>("");

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "contact_email").maybeSingle()
      .then(({ data }) => setContactEmail(data?.value ?? ""));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    if (message.length > 5000) { toast.error("Message too long."); return; }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    });
    setLoading(false);
    if (error) { toast.error("Could not send. Please try again."); return; }
    setName(""); setEmail(""); setMessage("");
    toast.success("Thank you. We'll be in touch.");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="text-center">
        <p className="uppercase-track text-xs text-gold">Get in touch</p>
        <h1 className="mt-3 font-display text-5xl font-bold md:text-6xl">Write to us</h1>
        <p className="mt-4 text-muted-foreground">
          Tips, pitches, questions. We read every message.
        </p>
        {contactEmail && (
          <a href={`mailto:${contactEmail}`} className="mt-3 inline-flex items-center gap-2 text-xs uppercase-track text-gold">
            <Mail className="h-3 w-3" /> {contactEmail}
          </a>
        )}
      </div>

      <form onSubmit={submit} className="mt-12 space-y-5 rounded-sm border border-border bg-card p-8 shadow-elevated">
        <div>
          <label className="block text-xs uppercase-track text-muted-foreground">Name</label>
          <input
            required maxLength={100}
            value={name} onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-sm border border-border bg-background px-4 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase-track text-muted-foreground">Email</label>
          <input
            required type="email" maxLength={254}
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-sm border border-border bg-background px-4 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs uppercase-track text-muted-foreground">Message</label>
          <textarea
            required maxLength={5000} rows={6}
            value={message} onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full rounded-sm border border-border bg-background px-4 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full rounded-sm bg-gradient-gold px-6 py-3 text-xs uppercase-track text-gold-foreground shadow-gold transition-transform hover:scale-[1.01] disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
