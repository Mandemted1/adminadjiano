import { supabaseAdmin } from "@/lib/supabase-server";
import AdminShell from "@/components/AdminShell";

export default async function CustomersPage() {
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("guest_email, user_id, total, status");

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name");

  const profileMap: Record<string, string> = {};
  for (const p of profiles ?? []) profileMap[p.id] = p.full_name ?? "—";

  // Group by customer identifier
  const map: Record<string, { email: string; totalSpent: number; orderCount: number; cancelled: number }> = {};
  for (const o of orders ?? []) {
    const key = o.guest_email ?? o.user_id ?? "unknown";
    const label = o.guest_email ?? (o.user_id ? profileMap[o.user_id] ?? "Account user" : "Unknown");
    if (!map[key]) map[key] = { email: label, totalSpent: 0, orderCount: 0, cancelled: 0 };
    map[key].orderCount++;
    if (o.status !== "cancelled") map[key].totalSpent += Number(o.total);
    if (o.status === "cancelled") map[key].cancelled++;
  }

  const customers = Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, marginBottom: "2rem" }}>Customers</h1>

      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5" }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "0.75rem 1.25rem", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
          {["Customer", "Total Spent", "Orders", "Cancelled"].map((h) => (
            <span key={h} style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>{h}</span>
          ))}
        </div>
        {customers.length === 0 && <p style={{ padding: "2rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb", textAlign: "center" }}>No customers yet</p>}
        {customers.map((c, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "0.9rem 1.25rem", borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, color: "#000" }}>GHS {c.totalSpent}</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#555" }}>{c.orderCount}</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: c.cancelled > 0 ? "#c62828" : "#888" }}>{c.cancelled}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
