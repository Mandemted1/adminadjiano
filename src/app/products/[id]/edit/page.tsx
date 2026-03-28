import { supabaseAdmin } from "@/lib/supabase-server";
import AdminShell from "@/components/AdminShell";
import ProductForm from "@/components/ProductForm";
import type { Product } from "@/lib/types";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin.from("products").select("*").eq("id", id).single();
  if (!data) return <AdminShell><p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb" }}>Product not found.</p></AdminShell>;
  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, marginBottom: "2rem" }}>Edit Product</h1>
      <ProductForm product={data as Product} />
    </AdminShell>
  );
}
