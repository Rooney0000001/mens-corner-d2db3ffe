import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Mail, MailOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/messages")({
  component: Messages,
});

type M = { id: string; name: string; email: string; message: string; read: boolean; created_at: string };

function Messages() {
  const [list, setList] = useState<M[]>([]);

  async function load() {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setList((data ?? []) as M[]);
  }
  useEffect(() => { load(); }, []);

  async function toggleRead(m: M) {
    const { error } = await supabase.from("contact_messages").update({ read: !m.read }).eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function remove(m: M) {
    if (!confirm("Delete message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">{list.length} total · {list.filter((m) => !m.read).length} unread</p>

      <div className="mt-8 space-y-3">
        {list.length === 0 ? (
          <div className="rounded-sm border border-border bg-card p-12 text-center text-muted-foreground">No messages yet.</div>
        ) : list.map((m) => (
          <div key={m.id} className={`rounded-sm border bg-card p-5 ${m.read ? "border-border" : "border-gold/40 shadow-gold"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{m.name} <span className="text-xs text-muted-foreground">&lt;{m.email}&gt;</span></p>
                <p className="text-xs text-muted-foreground">{formatDate(m.created_at)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleRead(m)} className="rounded p-1.5 text-muted-foreground hover:text-gold">
                  {m.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4 text-gold" />}
                </button>
                <button onClick={() => remove(m)} className="rounded p-1.5 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
