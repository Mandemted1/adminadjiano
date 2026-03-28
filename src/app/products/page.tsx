"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import type { Product } from "@/lib/types";

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button onClick={onToggle}
    style={{ width: "36px", height: "20px", borderRadius: "10px", border: "none", cursor: "pointer", backgroundColor: on ? "#000" : "#e0e0e0", transition: "background 0.2s", position: "relative", flexShrink: 0 }}>
    <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: "3px", transition: "left 0.2s", left: on ? "19px" : "3px" }} />
  </button>
);

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = () => supabase.from("products").select("*").order("created_at", { ascending: false })
    .then(({ data }) => { setProducts((data ?? []) as Product[]); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { count } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);
    if (count && count > 0) {
      alert(`Cannot delete — this product appears in ${count} order(s).`);
      return;
    }
    await supabase.from("products").delete().eq("id", id);
    setProducts((p) => p.filter((x) => x.id !== id));
  };

  const toggleField = async (product: Product, field: "featured" | "bestseller") => {
    const newVal = !product[field];
    await supabase.from("products").update({ [field]: newVal }).eq("id", product.id);
    setProducts((p) => p.map((x) => x.id === product.id ? { ...x, [field]: newVal } : x));
  };

  return (
    <AdminShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400 }}>Products</h1>
        <Link href="/products/new" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#000", color: "#fff", padding: "0.65rem 1.25rem", fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          <Plus size={13} strokeWidth={2} /> New Product
        </Link>
      </div>

      <div className="table-scroll">
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", minWidth: "700px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 2fr 1.5fr 1fr 1fr 1fr 1fr 80px", padding: "0.75rem 1.25rem", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
          {["", "Product", "Collection", "Price", "Stock", "Featured", "Bestseller", ""].map((h, i) => (
            <span key={i} style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>{h}</span>
          ))}
        </div>
        {loading && <p style={{ padding: "2rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb", textAlign: "center" }}>Loading...</p>}
        {products.map((p) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "60px 2fr 1.5fr 1fr 1fr 1fr 1fr 80px", padding: "0.85rem 1.25rem", borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
            <div style={{ width: "48px", height: "48px", backgroundColor: "#f0f0f0", position: "relative" }}>
              {p.images[0] && <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: "contain" }} sizes="48px" />}
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.name}</p>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#888", marginTop: "2px" }}>{p.id}</p>
            </div>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#555" }}>{p.collection}</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px" }}>GHS {p.price}</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: p.stock < 5 ? "#c62828" : "#000" }}>{p.stock}</p>
            <Toggle on={p.featured} onToggle={() => toggleField(p, "featured")} />
            <Toggle on={!!p.bestseller} onToggle={() => toggleField(p, "bestseller")} />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link href={`/products/${p.id}/edit`} style={{ color: "#555", display: "flex" }}><Pencil size={14} strokeWidth={1.5} /></Link>
              <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", display: "flex", padding: 0 }}><Trash2 size={14} strokeWidth={1.5} /></button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </AdminShell>
  );
}
