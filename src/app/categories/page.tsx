"use client";
import { useEffect, useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";

interface Category { id: string; name: string; description: string | null; parent_id: string | null; homepage_label: string | null; created_at: string; count?: number; }

const inp: React.CSSProperties = { border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "#000", outline: "none", backgroundColor: "#fff", width: "100%" };
const lbl: React.CSSProperties = { fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.35rem" };

export default function CategoriesPage() {
  const [cats, setCats]       = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ name: "", description: "", parent_id: "" });
  const [editId, setEditId]   = useState<string | null>(null);
  const [editName, setEditName]           = useState("");
  const [editHomepageLabel, setEditHomepageLabel] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const load = async () => {
    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("collection"),
    ]);
    const counts: Record<string, number> = {};
    for (const p of products ?? []) counts[p.collection] = (counts[p.collection] ?? 0) + 1;
    setCats((categories ?? []).map((c) => ({ ...c, count: counts[c.name] ?? 0 })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const parents = cats.filter((c) => !c.parent_id);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    const id = form.name.trim().toLowerCase().replace(/\s+/g, "-");
    const { error: err } = await supabase.from("categories").insert({
      id,
      name: form.name.trim(),
      description: form.description || null,
      parent_id: form.parent_id || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ name: "", description: "", parent_id: "" }); setSaving(false); load();
  };

  const handleEdit = async (id: string) => {
    await supabase.from("categories").update({
      name: editName,
      homepage_label: editHomepageLabel.trim() || null,
    }).eq("id", id);
    setEditId(null); load();
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditHomepageLabel(cat.homepage_label ?? "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Any subcategories will become top-level.")) return;
    await supabase.from("categories").delete().eq("id", id);
    setCats((c) => c.filter((x) => x.id !== id));
  };

  // Build tree for display: parents first, then indented children
  const tree: Category[] = [];
  for (const parent of parents) {
    tree.push(parent);
    for (const child of cats.filter((c) => c.parent_id === parent.id)) {
      tree.push(child);
    }
  }
  for (const cat of cats.filter((c) => c.parent_id && !parents.find((p) => p.id === c.parent_id))) {
    tree.push(cat);
  }

  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, marginBottom: "2rem" }}>Categories</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Create */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>New Category</p>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={lbl}>Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Velvet Collection" style={inp} />
            </div>
            <div>
              <label style={lbl}>Parent Category (optional)</label>
              <select value={form.parent_id} onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))} style={inp}>
                <option value="">None (top-level)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Description (optional)</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} />
            </div>
            {error && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#c00" }}>{error}</p>}
            <button type="submit" disabled={saving}
              style={{ backgroundColor: "#000", color: "#fff", border: "none", padding: "0.7rem", fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Creating..." : "Create"}
            </button>
          </form>
        </div>

        {/* List */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", padding: "0.75rem 1.25rem", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
            {["Category", "Products", "Homepage Label", ""].map((h) => (
              <span key={h} style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>{h}</span>
            ))}
          </div>
          {loading && <p style={{ padding: "1.5rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb" }}>Loading...</p>}
          {tree.map((cat) => {
            const isChild = !!cat.parent_id;
            return (
              <div key={cat.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", padding: "0.85rem 1.25rem", borderBottom: "1px solid #f0f0f0", alignItems: "center", backgroundColor: isChild ? "#fafafa" : "#fff" }}>
                {editId === cat.id ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" style={{ ...inp, padding: "0.4rem 0.6rem", fontSize: "10px" }} autoFocus />
                      <input value={editHomepageLabel} onChange={(e) => setEditHomepageLabel(e.target.value)} placeholder="Homepage label (optional)" style={{ ...inp, padding: "0.4rem 0.6rem", fontSize: "10px" }} />
                    </div>
                    <span />
                    <span />
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => handleEdit(cat.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2e7d32" }}><Check size={14} strokeWidth={2} /></button>
                      <button onClick={() => setEditId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><X size={14} strokeWidth={2} /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ paddingLeft: isChild ? "1.25rem" : "0" }}>
                      {isChild && <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "8px", color: "#ccc", marginRight: "0.4rem" }}>↳</span>}
                      <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: isChild ? 400 : 600, color: "#000" }}>{cat.name}</span>
                      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#bbb", marginTop: "2px", paddingLeft: isChild ? "0.9rem" : "0" }}>{cat.id}</p>
                    </div>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#555" }}>{cat.count}</p>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: cat.homepage_label ? "#000" : "#ddd", fontStyle: cat.homepage_label ? "normal" : "italic" }}>
                      {cat.homepage_label ?? "—"}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => startEdit(cat)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555" }}><Pencil size={13} strokeWidth={1.5} /></button>
                      <button onClick={() => handleDelete(cat.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828" }}><Trash2 size={13} strokeWidth={1.5} /></button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#aaa", letterSpacing: "0.08em", marginTop: "1rem" }}>
        Set a Homepage Label on up to 3 top-level categories to control what appears in the big text menu on the homepage.
      </p>
    </AdminShell>
  );
}
