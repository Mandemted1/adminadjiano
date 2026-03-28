"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import type { DiscountCode } from "@/lib/types";

const inp: React.CSSProperties = { border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontFamily: "var(--font-montserrat)", fontSize: "11px", letterSpacing: "0.06em", color: "#000", outline: "none", backgroundColor: "#fff" };

export default function DiscountCodesPage() {
  const [codes, setCodes]   = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]     = useState({ code: "", percentage: "", max_uses: "", expires_at: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const load = () => supabase.from("discount_codes").select("*").order("created_at", { ascending: false })
    .then(({ data }) => { setCodes((data ?? []) as DiscountCode[]); setLoading(false); });

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      percentage: parseInt(form.percentage),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
    };
    const { error: err } = await supabase.from("discount_codes").insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ code: "", percentage: "", max_uses: "", expires_at: "" });
    setSaving(false);
    load();
  };

  const toggleActive = async (code: DiscountCode) => {
    await supabase.from("discount_codes").update({ active: !code.active }).eq("id", code.id);
    setCodes((c) => c.map((x) => x.id === code.id ? { ...x, active: !x.active } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    await supabase.from("discount_codes").delete().eq("id", id);
    setCodes((c) => c.filter((x) => x.id !== id));
  };

  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, marginBottom: "2rem" }}>Discount Codes</h1>

      {/* Create form */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>Create New Code</p>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.35rem" }}>Code</label>
            <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required placeholder="SUMMER20" style={{ ...inp, width: "160px" }} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.35rem" }}>% Off</label>
            <input type="number" min="1" max="100" value={form.percentage} onChange={(e) => set("percentage", e.target.value)} required placeholder="20" style={{ ...inp, width: "80px" }} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.35rem" }}>Max Uses (optional)</label>
            <input type="number" min="1" value={form.max_uses} onChange={(e) => set("max_uses", e.target.value)} placeholder="∞" style={{ ...inp, width: "120px" }} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.35rem" }}>Expires (optional)</label>
            <input type="date" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} style={{ ...inp, width: "160px" }} />
          </div>
          <button type="submit" disabled={saving}
            style={{ backgroundColor: "#000", color: "#fff", border: "none", padding: "0.65rem 1.5rem", fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Creating..." : "Create"}
          </button>
        </form>
        {error && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#c00", marginTop: "0.75rem" }}>{error}</p>}
      </div>

      {/* Table */}
      <div className="table-scroll">
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", minWidth: "520px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 60px", padding: "0.75rem 1.25rem", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
          {["Code", "% Off", "Uses", "Expires", "Active", ""].map((h) => (
            <span key={h} style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>{h}</span>
          ))}
        </div>
        {loading && <p style={{ padding: "2rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb", textAlign: "center" }}>Loading...</p>}
        {!loading && codes.length === 0 && <p style={{ padding: "2rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb", textAlign: "center" }}>No codes yet</p>}
        {codes.map((c) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 60px", padding: "0.9rem 1.25rem", borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "#000" }}>{c.code}</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px" }}>{c.percentage}%</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#555" }}>{c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#888" }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-GB") : "—"}</p>
            <button onClick={() => toggleActive(c)}
              style={{ width: "36px", height: "20px", borderRadius: "10px", border: "none", cursor: "pointer", backgroundColor: c.active ? "#000" : "#e0e0e0", transition: "background 0.2s", position: "relative" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: "3px", transition: "left 0.2s", left: c.active ? "19px" : "3px" }} />
            </button>
            <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", display: "flex", padding: 0 }}><Trash2 size={14} strokeWidth={1.5} /></button>
          </div>
        ))}
      </div>
      </div>
    </AdminShell>
  );
}
