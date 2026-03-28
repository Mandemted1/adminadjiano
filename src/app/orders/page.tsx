"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import type { Order, OrderStatus } from "@/lib/types";

const statusColor: Record<OrderStatus, string> = { processing:"#e65100", in_transit:"#1565c0", delivered:"#2e7d32", cancelled:"#c62828" };
const statusLabel: Record<OrderStatus, string> = { processing:"Processing", in_transit:"In Transit", delivered:"Delivered", cancelled:"Cancelled" };
const tabs = ["all", "processing", "in_transit", "delivered", "cancelled"] as const;

export default function OrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [tab, setTab]         = useState<typeof tabs[number]>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setOrders((data ?? []) as Order[]); setLoading(false); });
  }, []);

  const filtered = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, marginBottom: "2rem" }}>Orders</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid #e5e5e5", paddingBottom: "0" }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "0.6rem 1rem", fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", color: tab === t ? "#000" : "#999", borderBottom: tab === t ? "2px solid #000" : "2px solid transparent", marginBottom: "-1px" }}>
            {t === "all" ? "All" : statusLabel[t as OrderStatus]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-scroll">
      <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", minWidth: "560px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "0.75rem 1.25rem", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
          {["Order", "Customer", "Total", "Status", ""].map((h) => (
            <span key={h} style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>{h}</span>
          ))}
        </div>
        {loading && <p style={{ padding: "2rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb", textAlign: "center" }}>Loading...</p>}
        {!loading && filtered.length === 0 && <p style={{ padding: "2rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb", textAlign: "center" }}>No orders</p>}
        {filtered.map((order) => (
          <div key={order.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "1rem 1.25rem", borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
            <div>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#000" }}>#{order.id.slice(0,8).toUpperCase()}</p>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#888", marginTop: "2px" }}>{new Date(order.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</p>
            </div>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.guest_email ?? "Account user"}</p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#000" }}>GHS {order.total}</p>
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: statusColor[order.status], backgroundColor: `${statusColor[order.status]}18`, padding: "3px 8px", display: "inline-block" }}>
              {statusLabel[order.status]}
            </span>
            <Link href={`/orders/${order.id}`} style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#000", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              View
            </Link>
          </div>
        ))}
      </div>
      </div>
    </AdminShell>
  );
}
