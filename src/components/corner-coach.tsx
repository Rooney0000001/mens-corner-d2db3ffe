import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "@tanstack/react-router";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/corner-coach`;
const STORAGE_KEY = "corner-coach-history";

const STARTERS = [
  "How do I build real discipline?",
  "Where do I start with money mindset?",
  "How do I find my purpose?",
  "Tips to build confidence",
];

export function CornerCoach() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (resp.status === 429) { toast.error("Rate limit reached. Try again in a minute."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Please top up."); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error("Coach is unavailable right now."); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let started = false;
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistant += delta;
              if (!started) {
                started = true;
                setMessages((p) => [...p, { role: "assistant", content: assistant }]);
              } else {
                setMessages((p) => p.map((m, i) => i === p.length - 1 ? { ...m, content: assistant } : m));
              }
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection lost. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Corner Coach"
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-gold text-gold-foreground shadow-gold transition-transform hover:scale-105",
          open && "rotate-90",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border border-gold/30 bg-card shadow-elevated",
            "bottom-24 right-5 left-5 max-h-[75vh] rounded-sm",
            "sm:left-auto sm:right-5 sm:w-[400px] sm:max-h-[600px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold">
                <Sparkles className="h-4 w-4 text-gold-foreground" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-cream">Corner Coach</p>
                <p className="text-[10px] uppercase-track text-muted-foreground">Your AI mentor</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={reset} className="text-[10px] uppercase-track text-muted-foreground hover:text-gold">
                Reset
              </button>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="rounded-sm border border-border bg-background/40 p-4">
                  <p className="text-sm text-cream">
                    I'm <span className="text-gold">Corner Coach</span>. Ask me about discipline, money, purpose, confidence, or anything you're wrestling with. I'll keep it sharp and practical.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase-track text-muted-foreground">Try asking</p>
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full rounded-sm border border-border bg-background/30 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-sm px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-gradient-gold text-gold-foreground"
                      : "border border-border bg-background/50 text-cream",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose-coach">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            const isInternal = href?.startsWith("/");
                            if (isInternal) {
                              return (
                                <Link
                                  to={href!}
                                  onClick={() => setOpen(false)}
                                  className="font-medium text-gold underline underline-offset-2 hover:opacity-80"
                                >
                                  {children}
                                </Link>
                              );
                            }
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-gold underline underline-offset-2 hover:opacity-80">
                                {children}
                              </a>
                            );
                          },
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-4">{children}</ul>,
                          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-4">{children}</ol>,
                          strong: ({ children }) => <strong className="text-gold">{children}</strong>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-sm border border-border bg-background/50 px-3 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-border bg-background/60 p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
                rows={1}
                placeholder="Ask the coach..."
                className="flex-1 resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm text-cream placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-sm bg-gradient-gold text-gold-foreground transition-opacity disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
