import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { X, Send, RotateCcw, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/mens-corner-logo.png";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/corner-coach`;
const STORAGE_KEY = "corner-coach-history";
const SESSION_KEY = "corner-coach-session";

const STARTERS = [
  "How do I build real discipline?",
  "I keep procrastinating.",
  "Where do I start with money?",
  "How do I find my purpose?",
];

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function CornerCoach() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history once on mount (client only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (trimmed.length > 2000) {
      toast.error("Message is too long. Keep it under 2000 characters.");
      return;
    }
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
        body: JSON.stringify({
          messages: next,
          sessionId: getSessionId(),
        }),
      });

      if (resp.status === 429) {
        toast.error("Too many messages. Wait a minute.");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted.");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error("Coach is unavailable right now.");
        setLoading(false);
        return;
      }

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
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistant += delta;
              if (!started) {
                started = true;
                setMessages((p) => [...p, { role: "assistant", content: assistant }]);
              } else {
                setMessages((p) =>
                  p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistant } : m)),
                );
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
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Talk to Corner Coach"
          className="group fixed right-5 top-1/2 z-50 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-background shadow-gold transition-transform hover:scale-105"
        >
          <img
            src={logo}
            alt="Corner Coach"
            className="h-14 w-14 object-contain transition-transform group-hover:scale-105"
          />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
          </span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col border border-gold/30 bg-background shadow-gold",
            // Mobile: full-screen-ish bottom sheet
            "inset-x-2 bottom-2 top-16 rounded-sm",
            // Desktop: floating card bottom right
            "sm:inset-auto sm:bottom-5 sm:right-5 sm:top-auto sm:h-[600px] sm:max-h-[80vh] sm:w-[400px]",
          )}
          role="dialog"
          aria-label="Corner Coach chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="" className="h-9 w-9 object-contain" />
              <div>
                <p className="font-display text-sm font-semibold leading-tight text-cream">
                  Corner Coach
                </p>
                <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />
                  Online — ask me anything
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/coach"
                onClick={() => setOpen(false)}
                aria-label="Open full page"
                title="Open full page"
                className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-gold"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-gold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="rounded-sm border border-gold/20 bg-card p-3">
                  <p className="text-sm leading-relaxed text-cream">
                    Hey — I'm <span className="text-gold">Corner Coach</span>. Tell me what
                    you're wrestling with: discipline, money, purpose, women, fitness, fear.
                    I'll give it to you straight.
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] uppercase-track text-gold">Try one</p>
                  <div className="space-y-1.5">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="block w-full rounded-sm border border-border bg-card/60 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-gold/50 hover:text-cream"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-sm px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-gradient-gold text-gold-foreground"
                      : "border border-border bg-card text-cream",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose-coach text-sm">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            const isInternal = href?.startsWith("/");
                            if (isInternal) {
                              return (
                                <Link
                                  to={href!}
                                  onClick={() => setOpen(false)}
                                  className="font-medium text-gold underline underline-offset-2"
                                >
                                  {children}
                                </Link>
                              );
                            }
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-gold underline underline-offset-2"
                              >
                                {children}
                              </a>
                            );
                          },
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => (
                            <ul className="my-1 list-disc space-y-0.5 pl-4">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-1 list-decimal space-y-0.5 pl-4">{children}</ol>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-gold">{children}</strong>
                          ),
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
                <div className="flex gap-1 rounded-sm border border-border bg-card px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border bg-card p-3"
          >
            <div className="flex items-end gap-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-gold/50 hover:text-gold"
                  aria-label="Reset conversation"
                  title="Reset conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Type your message…"
                className="flex-1 resize-none rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-cream placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gradient-gold text-gold-foreground transition-opacity disabled:opacity-40"
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

