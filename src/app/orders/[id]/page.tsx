"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/AdminShell";
import type { Order, OrderStatus } from "@/lib/types";

const statusLabel: Record<OrderStatus, string> = { processing:"Processing", in_transit:"In Transit", delivered:"Delivered", cancelled:"Cancelled" };
const statusColor: Record<OrderStatus, string>  = { processing:"#e65100", in_transit:"#1565c0", delivered:"#2e7d32", cancelled:"#c62828" };

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder]     = useState<Order | null>(null);
  const [status, setStatus]   = useState<OrderStatus>("processing");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    supabase.from("orders").select("*, order_items(*)").eq("id", id).single()
      .then(({ data }) => { if (data) { setOrder(data as Order); setStatus(data.status); } });
  }, [id]);

  const handleStatusUpdate = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/orders/${id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ status }),
    });
    setOrder((o) => o ? { ...o, status } : o);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!order) return <AdminShell><p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#bbb" }}>Loading...</p></AdminShell>;

  const addr = order.shipping_address;

  return (
    <AdminShell>
      <Link href="/orders" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontFamily: "var(--font-montserrat)", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "1.5rem" }}>
        <ChevronLeft size={12} strokeWidth={1.5} /> Orders
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400 }}>#{order.id.slice(0,8).toUpperCase()}</h1>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#888", marginTop: "4px" }}>
            {new Date(order.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}
            style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", letterSpacing: "0.08em", border: "1px solid #e0e0e0", padding: "0.6rem 0.75rem", backgroundColor: "#fff", cursor: "pointer", outline: "none" }}>
            {(Object.keys(statusLabel) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
          <button onClick={handleStatusUpdate} disabled={saving}
            style={{ backgroundColor: "#000", color: "#fff", border: "none", padding: "0.6rem 1.25rem", fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saved ? "Saved!" : saving ? "Saving..." : "Update"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>
        {/* Items */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#000", marginBottom: "1.25rem" }}>Items</p>
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", marginBottom: "0.75rem", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.name} {item.quantity > 1 ? `× ${item.quantity}` : ""}</p>
              </div>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px" }}>GHS {item.price * item.quantity}</p>
            </div>
          ))}
        </div>

        {/* Summary + address */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem" }}>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#000", marginBottom: "1rem" }}>Summary</p>
            {[
              { label: "Customer", value: order.guest_email ?? "Account user" },
              { label: "Payment", value: order.payment_method ?? "—" },
              { label: "Subtotal", value: `GHS ${order.subtotal}` },
              { label: "Shipping", value: `GHS ${order.shipping}` },
              ...(order.discount_code ? [{ label: `Discount (${order.discount_code})`, value: `-GHS ${order.discount_amount}` }] : []),
              { label: "Total", value: `GHS ${order.total}` },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#888" }}>{row.label}</span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#000" }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #f0f0f0" }}>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: statusColor[order.status], backgroundColor: `${statusColor[order.status]}18`, padding: "3px 10px" }}>
                {statusLabel[order.status]}
              </span>
            </div>
          </div>

          {addr && (
            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem" }}>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#000", marginBottom: "0.75rem" }}>Shipping Address</p>
              {[addr.name, addr.address, `${addr.city}, ${addr.region}`, addr.country].map((line) => (
                <p key={line} style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#555", lineHeight: 1.8 }}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
