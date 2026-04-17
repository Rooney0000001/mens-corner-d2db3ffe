import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const KEYS = [
  { key: "about_content", label: "About page content", multiline: true },
  { key: "contact_email", label: "Contact email", multiline: false },
  { key: "ebook_title", label: "eBook title", multiline: false },
  { key: "ebook_url", label: "eBook URL (Buy link)", multiline: false },
] as const;

export const Route = createFileRoute("/admin/settings")({
  component: Settings,
});

function Settings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("key,value").then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((r) => { if (r.value !== null) m[r.key] = r.value; });
      setValues(m);
    });
  }, []);

  async function save() {
    setSaving(true);
    const rows = KEYS.map((k) => ({ key: k.key, value: values[k.key] ?? "" }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Edit site-wide content.</p>

      <div className="mt-8 space-y-5">
        {KEYS.map((k) => (
          <div key={k.key}>
            <label className="block text-xs uppercase-track text-muted-foreground">{k.label}</label>
            {k.multiline ? (
              <textarea rows={6} value={values[k.key] ?? ""} onChange={(e) => setValues({ ...values, [k.key]: e.target.value })}
                className="mt-2 w-full rounded-sm border border-border bg-card px-3 py-2 text-sm" />
            ) : (
              <input value={values[k.key] ?? ""} onChange={(e) => setValues({ ...values, [k.key]: e.target.value })}
                className="mt-2 w-full rounded-sm border border-border bg-card px-3 py-2 text-sm" />
            )}
          </div>
        ))}
        <button onClick={save} disabled={saving}
          className="rounded-sm bg-gradient-gold px-6 py-3 text-xs uppercase-track text-gold-foreground shadow-gold disabled:opacity-50">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
