"use client";
import { useEffect, useState } from "react";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";

interface VelvetImage { id: string; image_url: string; alt_text: string; sort_order: number; active: boolean; }

const inp: React.CSSProperties = { border: "1px solid #e0e0e0", padding: "0.65rem 0.875rem", fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "#000", outline: "none", backgroundColor: "#fff", width: "100%" };
const lbl: React.CSSProperties = { fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.35rem" };

export default function HomepagePage() {
  const [images, setImages] = useState<VelvetImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({ image_url: "", alt_text: "" });

  const load = async () => {
    const { data } = await supabase.from("velvet_images").select("*").order("sort_order");
    setImages((data ?? []) as VelvetImage[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setSaving(true);
    const maxOrder = images.length > 0 ? Math.max(...images.map((x) => x.sort_order)) + 1 : 0;
    const { error: err } = await supabase.from("velvet_images").insert({
      image_url: form.image_url.trim(),
      alt_text:  form.alt_text.trim(),
      sort_order: maxOrder,
      active: true,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setForm({ image_url: "", alt_text: "" });
    setSaving(false);
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("velvet_images").update({ active: !current }).eq("id", id);
    setImages((prev) => prev.map((x) => x.id === id ? { ...x, active: !current } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this image?")) return;
    await supabase.from("velvet_images").delete().eq("id", id);
    setImages((prev) => prev.filter((x) => x.id !== id));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...images];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    // Re-assign sort_order values
    const updated = next.map((img, i) => ({ ...img, sort_order: i }));
    setImages(updated);
    await Promise.all(
      updated.map((img) => supabase.from("velvet_images").update({ sort_order: img.sort_order }).eq("id", img.id))
    );
  };

  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, marginBottom: "0.5rem" }}>Homepage</h1>
      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#aaa", letterSpacing: "0.08em", marginBottom: "2rem" }}>
        Manage the images in the Velvet Collection section.
      </p>

      <div className="r-form-list">

        {/* Add form */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>Add Image</p>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label style={lbl}>Image URL (from Cloudinary)</label>
              <input required value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://res.cloudinary.com/..." style={inp} />
            </div>
            <div>
              <label style={lbl}>Alt Text</label>
              <input value={form.alt_text} onChange={(e) => setForm((f) => ({ ...f, alt_text: e.target.value }))} placeholder="Blue Velvet Durag" style={inp} />
            </div>
            {error && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#c00" }}>{error}</p>}
            <button type="submit" disabled={saving}
              style={{ backgroundColor: "#000", color: "#fff", border: "none", padding: "0.7rem", fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Adding..." : "Add"}
            </button>
          </form>
        </div>

        {/* List */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 70px 70px 50px", padding: "0.75rem 1.25rem", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
            {["", "Image", "Order", "Active", ""].map((h, i) => (
              <span key={i} style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>{h}</span>
            ))}
          </div>

          {loading && <p style={{ padding: "1.5rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb" }}>Loading...</p>}
          {!loading && images.length === 0 && (
            <p style={{ padding: "1.5rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb" }}>No images yet — add one to replace the default placeholders.</p>
          )}

          {images.map((img, index) => (
            <div key={img.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 70px 70px 50px", padding: "0.85rem 1.25rem", borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
              {/* Thumbnail */}
              <div style={{ width: "44px", height: "52px", overflow: "hidden", backgroundColor: "#f5f5f5", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.alt_text} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>

              {/* Alt */}
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {img.alt_text || "—"}
              </p>

              {/* Reorder */}
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button onClick={() => move(index, -1)} disabled={index === 0} style={{ background: "none", border: "none", cursor: index === 0 ? "default" : "pointer", color: index === 0 ? "#ddd" : "#555" }}>
                  <ArrowUp size={13} strokeWidth={1.5} />
                </button>
                <button onClick={() => move(index, 1)} disabled={index === images.length - 1} style={{ background: "none", border: "none", cursor: index === images.length - 1 ? "default" : "pointer", color: index === images.length - 1 ? "#ddd" : "#555" }}>
                  <ArrowDown size={13} strokeWidth={1.5} />
                </button>
              </div>

              {/* Active toggle */}
              <button onClick={() => toggleActive(img.id, img.active)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: `1px solid ${img.active ? "#000" : "#e0e0e0"}`, padding: "0.35rem 0.6rem", cursor: "pointer", fontFamily: "var(--font-montserrat)", fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: img.active ? "#000" : "#bbb" }}>
                {img.active ? "On" : "Off"}
              </button>

              {/* Delete */}
              <button onClick={() => handleDelete(img.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828" }}>
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
