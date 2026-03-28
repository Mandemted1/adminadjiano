"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

interface Category { id: string; name: string; }

const inp: React.CSSProperties = { width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 0.875rem", fontFamily: "var(--font-montserrat)", fontSize: "11px", letterSpacing: "0.06em", color: "#000", outline: "none", backgroundColor: "#fff" };
const lbl: React.CSSProperties = { fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginBottom: "0.4rem", display: "block" };

export default function ProductForm({ product }: { product?: Product }) {
  const router     = useRouter();
  const isEdit     = !!product;
  const [form, setForm] = useState({
    id: product?.id ?? "",
    name: product?.name ?? "",
    collection: product?.collection ?? "",
    price: product?.price?.toString() ?? "",
    stock: product?.stock?.toString() ?? "",
    description: product?.description ?? "",
    images: product?.images?.join("\n") ?? "",
    featured: product?.featured ?? false,
    bestseller: product?.bestseller ?? false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name")
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const payload = {
      name: form.name,
      collection: form.collection,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      description: form.description || null,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      featured: form.featured,
      bestseller: form.bestseller,
    };

    if (isEdit) {
      const { error: err } = await supabase.from("products").update(payload).eq("id", product!.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const id = form.id.trim().toLowerCase().replace(/\s+/g, "-");
      const { error: err } = await supabase.from("products").insert({ id, ...payload });
      if (err) { setError(err.message); setSaving(false); return; }
    }
    router.push("/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {!isEdit && (
        <div>
          <label style={lbl}>Product ID (slug, e.g. navy-durag)</label>
          <input value={form.id} onChange={(e) => set("id", e.target.value)} required style={inp} placeholder="navy-durag" />
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div><label style={lbl}>Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} required style={inp} /></div>
        <div>
          <label style={lbl}>Collection</label>
          <select value={form.collection} onChange={(e) => set("collection", e.target.value)} required style={inp}>
            <option value="">Select collection...</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div><label style={lbl}>Price (GHS)</label><input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} required style={inp} /></div>
        <div><label style={lbl}>Stock</label><input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} required style={inp} /></div>
      </div>
      <div>
        <label style={lbl}>Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} />
      </div>
      <div>
        <label style={lbl}>Image URLs (one per line, from Cloudinary)</label>
        <textarea value={form.images} onChange={(e) => set("images", e.target.value)} rows={4} style={{ ...inp, resize: "vertical" }} placeholder="https://res.cloudinary.com/..." />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
        <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} style={{ accentColor: "#000", width: "14px", height: "14px" }} />
        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Featured (shown in scrolling strip on homepage)</span>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
        <input type="checkbox" checked={form.bestseller} onChange={(e) => set("bestseller", e.target.checked)} style={{ accentColor: "#000", width: "14px", height: "14px" }} />
        <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Bestseller (shown on /bestsellers page)</span>
      </label>
      {error && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#c00" }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="submit" disabled={saving}
          style={{ backgroundColor: "#000", color: "#fff", border: "none", padding: "0.75rem 2rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button type="button" onClick={() => router.back()}
          style={{ backgroundColor: "transparent", color: "#888", border: "1px solid #e0e0e0", padding: "0.75rem 1.5rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
