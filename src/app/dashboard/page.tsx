import { getSupabaseAdmin } from "@/lib/supabase-server";
import AdminShell from "@/components/AdminShell";

const statusColor: Record<string, string> = {
  processing: "#e65100", in_transit: "#1565c0", delivered: "#2e7d32", cancelled: "#c62828",
};
const statusLabel: Record<string, string> = {
  processing: "Processing", in_transit: "In Transit", delivered: "Delivered", cancelled: "Cancelled",
};

export default async function DashboardPage() {
  const db = getSupabaseAdmin();
  const [ordersRes, itemsRes] = await Promise.all([
    db.from("orders").select("id, total, status, created_at, guest_email, user_id"),
    db.from("order_items").select("name, quantity"),
  ]);

  const orders = ordersRes.data ?? [];
  const items  = itemsRes.data ?? [];

  const today     = new Date().toISOString().slice(0, 10);
  const revenue   = orders.filter((o) => o.status !== "cancelled").reduce((s: number, o) => s + Number(o.total), 0);
  const todayCount = orders.filter((o) => o.created_at.slice(0, 10) === today).length;
  const recent5   = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  // Top 5 products
  const productSales: Record<string, number> = {};
  for (const item of items) {
    productSales[item.name] = (productSales[item.name] ?? 0) + item.quantity;
  }
  const top5 = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const stat = (label: string, value: string | number) => (
    <div style={{ backgroundColor: "#fff", padding: "1.5rem", border: "1px solid #e5e5e5" }}>
      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "0.5rem" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, color: "#000" }}>{value}</p>
    </div>
  );

  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, color: "#000", marginBottom: "2rem" }}>Dashboard</h1>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.5rem" }}>
        {stat("Total Revenue", `GHS ${revenue.toLocaleString()}`)}
        {stat("Orders Today", todayCount)}
        {stat("Total Orders", orders.length)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Top 5 products */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#000", marginBottom: "1.25rem" }}>Top 5 Products</p>
          {top5.length === 0 && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb" }}>No data yet</p>}
          {top5.map(([name, qty], i) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", marginBottom: "0.75rem", borderBottom: i < top5.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#bbb", width: "16px" }}>#{i + 1}</span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#000" }}>{name}</span>
              </div>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#555" }}>{qty} sold</span>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#000", marginBottom: "1.25rem" }}>Recent Orders</p>
          {recent5.map((order, i) => (
            <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", marginBottom: "0.75rem", borderBottom: i < recent5.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.06em", color: "#000" }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#888", marginTop: "2px" }}>{order.guest_email ?? "Account user"}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#000" }}>GHS {order.total}</p>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: statusColor[order.status], backgroundColor: `${statusColor[order.status]}18`, padding: "2px 8px", marginTop: "4px", display: "inline-block" }}>
                  {statusLabel[order.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
