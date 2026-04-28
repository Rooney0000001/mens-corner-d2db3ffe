import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/corner-coach`;
const STORAGE_KEY = "corner-coach-history";

const STARTERS = [
  "How do I build real discipline?",
  "I keep procrastinating. Fix me.",
  "Where do I start with money?",
  "How do I stop being soft?",
  "How do I find my purpose?",
  "What does self-respect actually look like?",
];

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Corner Coach — Your AI Mentor | Men's Corner" },
      {
        name: "description",
        content:
          "Talk to Corner Coach: a strong, calm, disciplined AI mentor for the modern man. Direct answers on discipline, money, purpose, confidence, and growth.",
      },
      { property: "og:title", content: "Corner Coach — Your AI Mentor" },
      {
        property: "og:description",
        content:
          "A strong, calm, disciplined AI mentor for the modern man. No fluff, just truth.",
      },
    ],
  }),
  component: CoachPage,
});

function CoachPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

      if (resp.status === 429) {
        toast.error("Too many messages. Wait a minute and try again.");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please top up.");
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
            const delta = parsed.choices?.[0]?.delta?.content as
              | string
              | undefined;
            if (delta) {
              assistant += delta;
              if (!started) {
                started = true;
                setMessages((p) => [
                  ...p,
                  { role: "assistant", content: assistant },
                ]);
              } else {
                setMessages((p) =>
                  p.map((m, i) =>
                    i === p.length - 1 ? { ...m, content: assistant } : m,
                  ),
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
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase-track text-muted-foreground hover:text-gold"
          >
            <ArrowLeft className="h-3 w-3" /> Back home
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
              <Sparkles className="h-5 w-5 text-gold-foreground" />
            </div>
            <div className="text-right">
              <p className="font-display text-base font-semibold text-cream">
                Corner Coach
              </p>
              <p className="text-[10px] uppercase-track text-muted-foreground">
                Your AI mentor
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-5 overflow-y-auto py-6"
        >
          {messages.length === 0 && (
            <div className="space-y-6">
              <div className="rounded-sm border border-gold/30 bg-card p-6 shadow-gold">
                <p className="font-display text-2xl font-semibold text-cream">
                  Sit down. Let's talk.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  I'm <span className="text-gold">Corner Coach</span> — a
                  strong, calm, disciplined mentor in your pocket. Tell me what
                  you're wrestling with: discipline, money, purpose, women,
                  fitness, fear. I'll cut through the noise and tell you the
                  truth — not what you want to hear.
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase-track text-gold">
                  Where to start
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-sm border border-border bg-background/40 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-gold/50 hover:bg-card hover:text-cream"
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
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-gradient-gold text-gold-foreground"
                    : "border border-border bg-card text-cream",
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
                                className="font-medium text-gold underline underline-offset-2 hover:opacity-80"
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
                              className="font-medium text-gold underline underline-offset-2 hover:opacity-80"
                            >
                              {children}
                            </a>
                          );
                        },
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="my-2 list-disc space-y-1 pl-4">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="my-2 list-decimal space-y-1 pl-4">
                            {children}
                          </ol>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-gold">{children}</strong>
                        ),
                        h2: ({ children }) => (
                          <h2 className="mt-3 font-display text-base font-semibold text-cream">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mt-2 font-display text-sm font-semibold text-cream">
                            {children}
                          </h3>
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

          {loading &&
            messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-sm border border-border bg-card px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:240ms]" />
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
          className="border-t border-border pt-4"
        >
          <div className="flex items-end gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="flex h-11 w-11 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold"
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
              placeholder="Speak. What's on your mind?"
              className="flex-1 resize-none rounded-sm border border-border bg-background px-4 py-3 text-sm text-cream placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-sm bg-gradient-gold text-gold-foreground transition-opacity disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[10px] uppercase-track text-muted-foreground">
            Enter to send · Shift+Enter for newline
          </p>
        </form>
      </div>
    </div>
  );
}
