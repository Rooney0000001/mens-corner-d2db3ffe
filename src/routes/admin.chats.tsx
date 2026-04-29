import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Trash2, RefreshCcw, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Conversation = {
  id: string;
  session_id: string;
  user_agent: string | null;
  first_message: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export const Route = createFileRoute("/admin/chats")({
  component: AdminChats,
});

function shortDate(s: string) {
  const d = new Date(s);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deviceFromUA(ua: string | null) {
  if (!ua) return "Unknown";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

function AdminChats() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  async function loadConvos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("coach_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Failed to load conversations");
    } else {
      setConvos((data ?? []) as Conversation[]);
      if (data && data.length && !selected) setSelected(data[0].id);
    }
    setLoading(false);
  }

  async function loadMessages(id: string) {
    setLoadingMsgs(true);
    const { data, error } = await supabase
      .from("coach_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load messages");
    } else {
      setMessages((data ?? []) as Message[]);
    }
    setLoadingMsgs(false);
  }

  async function deleteConvo(id: string) {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    const { error } = await supabase
      .from("coach_conversations")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Conversation deleted");
    setConvos((c) => c.filter((x) => x.id !== id));
    if (selected === id) {
      setSelected(null);
      setMessages([]);
    }
  }

  useEffect(() => {
    loadConvos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected) loadMessages(selected);
    else setMessages([]);
  }, [selected]);

  const totalMessages = convos.reduce((sum, c) => sum + (c.message_count ?? 0), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Coach Chats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live conversations between visitors and Corner Coach.
          </p>
        </div>
        <button
          onClick={loadConvos}
          className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs uppercase-track text-muted-foreground hover:border-gold/50 hover:text-gold"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Conversations" value={convos.length} />
        <Stat label="Total messages" value={totalMessages} />
        <Stat
          label="Active today"
          value={
            convos.filter(
              (c) => Date.now() - new Date(c.updated_at).getTime() < 24 * 60 * 60 * 1000,
            ).length
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Conversation list */}
        <div className="rounded-sm border border-border bg-card">
          <div className="border-b border-border px-4 py-2 text-[10px] uppercase-track text-muted-foreground">
            Recent ({convos.length})
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            )}
            {!loading && convos.length === 0 && (
              <div className="px-4 py-12 text-center">
                <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet. They'll show up here when visitors chat with the
                  Coach.
                </p>
              </div>
            )}
            {convos.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cn(
                  "block w-full border-b border-border/60 px-4 py-3 text-left transition-colors",
                  selected === c.id
                    ? "bg-gold/10"
                    : "hover:bg-background/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase-track text-gold">
                    {deviceFromUA(c.user_agent)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {shortDate(c.updated_at)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-cream">
                  {c.first_message || "(no message)"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {c.message_count} message{c.message_count === 1 ? "" : "s"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Transcript */}
        <div className="rounded-sm border border-border bg-card">
          {!selected && (
            <div className="flex h-full min-h-[300px] items-center justify-center px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Select a conversation to read the transcript.
              </p>
            </div>
          )}
          {selected && (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase-track text-muted-foreground">
                    Transcript
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Session: {selected.slice(0, 8)}…
                  </p>
                </div>
                <button
                  onClick={() => deleteConvo(selected)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
                {loadingMsgs && (
                  <p className="text-center text-sm text-muted-foreground">Loading…</p>
                )}
                {!loadingMsgs && messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No messages stored.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-3",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {m.role === "assistant" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-background">
                        <Sparkles className="h-3.5 w-3.5 text-gold" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-sm px-3 py-2 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-gradient-gold text-gold-foreground"
                          : "border border-border bg-background text-cream",
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose-coach text-sm">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                      <p
                        className={cn(
                          "mt-1.5 text-[10px]",
                          m.role === "user"
                            ? "text-gold-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {shortDate(m.created_at)}
                      </p>
                    </div>
                    {m.role === "user" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <p className="text-[10px] uppercase-track text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-gradient-gold">{value}</p>
    </div>
  );
}
