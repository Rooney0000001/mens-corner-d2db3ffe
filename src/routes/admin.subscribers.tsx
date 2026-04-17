import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/subscribers")({
  component: Subs,
});

type S = { id: string; email: string; created_at: string };

function Subs() {
  const [list, setList] = useState<S[]>([]);

  async function load() {
    const { data } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
    setList((data ?? []) as S[]);
  }
  useEffect(() => { load(); }, []);

  function exportCsv() {
    const csv = "email,subscribed_at\n" + list.map((s) => `${s.email},${s.created_at}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `subscribers-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(s: S) {
    if (!confirm(`Remove ${s.email}?`)) return;
    const { error } = await supabase.from("subscribers").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Subscribers</h1>
          <p className="mt-1 text-sm text-muted-foreground">{list.length} total</p>
        </div>
        <button onClick={exportCsv} disabled={list.length === 0}
          className="inline-flex items-center gap-2 rounded-sm bg-gradient-gold px-4 py-2 text-xs uppercase-track text-gold-foreground disabled:opacity-50">
          <Download className="h-3 w-3" /> Export CSV
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-sm border border-border bg-card">
        {list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No subscribers yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-[10px] uppercase-track text-muted-foreground">
              <tr><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Joined</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(s)} className="rounded p-1.5 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
