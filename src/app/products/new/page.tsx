import AdminShell from "@/components/AdminShell";
import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, marginBottom: "2rem" }}>New Product</h1>
      <ProductForm />
    </AdminShell>
  );
}
