import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Copy, Trash2, Plus, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/team")({
  component: AdminTeam,
});

type Invite = {
  id: string;
  token: string;
  role: "admin" | "editor" | "user";
  email: string | null;
  note: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
};

type Member = {
  user_id: string;
  role: "admin" | "editor" | "user";
  display_name: string | null;
};

function generateToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function AdminTeam() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ role: "admin" | "editor"; email: string; note: string }>({
    role: "editor", email: "", note: "",
  });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: invs }, { data: roles }] = await Promise.all([
      supabase.from("invite_tokens").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").in("role", ["admin", "editor"]),
    ]);
    setInvites((invs ?? []) as Invite[]);

    const ids = Array.from(new Set(((roles ?? []) as { user_id: string }[]).map((r) => r.user_id)));
    const profiles = ids.length
      ? (await supabase.from("profiles").select("id, display_name").in("id", ids)).data ?? []
      : [];
    const nameMap = new Map(profiles.map((p) => [p.id as string, p.display_name as string | null]));
    setMembers(((roles ?? []) as { user_id: string; role: Member["role"] }[]).map((r) => ({
      user_id: r.user_id,
      role: r.role,
      display_name: nameMap.get(r.user_id) ?? null,
    })));
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading && isAdmin) load();
  }, [authLoading, isAdmin]);

  async function createInvite() {
    if (!user) return;
    setCreating(true);
    const token = generateToken();
    const { error } = await supabase.from("invite_tokens").insert({
      token,
      role: form.role,
      email: form.email.trim() || null,
      note: form.note.trim() || null,
      created_by: user.id,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Invite created");
    setForm({ role: "editor", email: "", note: "" });
    load();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this invite?")) return;
    const { error } = await supabase.from("invite_tokens").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  async function changeRole(userId: string, role: "admin" | "editor") {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    if (error) { toast.error(error.message); return; }
    toast.success("Role added");
    load();
  }

  async function removeMemberRole(userId: string, role: "admin" | "editor") {
    if (userId === user?.id) { toast.error("You cannot remove your own role."); return; }
    if (!confirm(`Remove ${role} role?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) { toast.error(error.message); return; }
    load();
  }

  if (authLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="text-muted-foreground">Admin access only.</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold">Team & invites</h1>
      <p className="mt-1 text-sm text-muted-foreground">Generate one-time signup links to invite admins or editors.</p>

      <div className="mt-8 rounded-sm border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Generate invite link</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "admin" | "editor" }))}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <input placeholder="Email (optional, for your reference)" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Note (optional)" value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={createInvite} disabled={creating}
            className="md:col-span-3 inline-flex items-center justify-center gap-2 rounded-sm bg-gradient-gold px-4 py-3 text-xs uppercase-track text-gold-foreground shadow-gold disabled:opacity-50">
            <Plus className="h-3 w-3" /> {creating ? "Creating…" : "Create invite link"}
          </button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Links are valid for 7 days and can be used once.</p>
      </div>

      <h2 className="mt-12 font-display text-xl font-semibold">Outstanding invites</h2>
      <div className="mt-4 space-y-2">
        {loading ? <p className="text-muted-foreground text-sm">Loading…</p> :
          invites.length === 0 ? <p className="text-muted-foreground text-sm">No invites yet.</p> :
          invites.map((inv) => {
            const used = !!inv.used_at;
            const expired = !used && new Date(inv.expires_at) < new Date();
            return (
              <div key={inv.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-card p-3 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase-track ${inv.role === "admin" ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>
                  {inv.role}
                </span>
                <span className="flex-1 truncate text-muted-foreground">
                  {inv.email ?? "(no email)"} {inv.note && <span className="text-foreground/60">— {inv.note}</span>}
                </span>
                <span className={`text-[11px] ${used ? "text-gold" : expired ? "text-destructive" : "text-muted-foreground"}`}>
                  {used ? "Used" : expired ? "Expired" : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                </span>
                {!used && !expired && (
                  <button onClick={() => copyLink(inv.token)}
                    className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[11px] hover:text-gold">
                    <Copy className="h-3 w-3" /> Copy link
                  </button>
                )}
                <button onClick={() => revoke(inv.id)}
                  className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[11px] hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })
        }
      </div>

      <h2 className="mt-12 font-display text-xl font-semibold">Team members</h2>
      <div className="mt-4 space-y-2">
        {members.length === 0 ? <p className="text-muted-foreground text-sm">No members yet.</p> :
          members.map((m) => (
            <div key={`${m.user_id}-${m.role}`} className="flex items-center gap-3 rounded-sm border border-border bg-card p-3 text-sm">
              <ShieldCheck className={`h-4 w-4 ${m.role === "admin" ? "text-gold" : "text-muted-foreground"}`} />
              <span className="flex-1 truncate">
                {m.display_name ?? m.user_id.slice(0, 8)}
                {m.user_id === user?.id && <span className="ml-2 text-[10px] uppercase-track text-gold">(you)</span>}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase-track">{m.role}</span>
              {m.role === "editor" && (
                <button onClick={() => changeRole(m.user_id, "admin")}
                  className="rounded-sm border border-border px-2 py-1 text-[11px] hover:text-gold">
                  Promote to admin
                </button>
              )}
              <button onClick={() => removeMemberRole(m.user_id, m.role as "admin" | "editor")}
                className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[11px] hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
