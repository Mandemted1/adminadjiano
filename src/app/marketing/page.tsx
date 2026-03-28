"use client";
import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";

const inp: React.CSSProperties = { width: "100%", border: "1px solid #e0e0e0", padding: "0.75rem 0.875rem", fontFamily: "var(--font-montserrat)", fontSize: "11px", letterSpacing: "0.06em", color: "#000", outline: "none", backgroundColor: "#fff" };
const lbl: React.CSSProperties = { fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginBottom: "0.4rem", display: "block" };

export default function MarketingPage() {
  const [subject,  setSubject]  = useState("");
  const [message,  setMessage]  = useState("");
  const [segment,  setSegment]  = useState("all");
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState<{ sent?: number; error?: string } | null>(null);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirm(`Send this email to all ${segment === "all" ? "customers" : "recent customers"}?`)) return;
    setSending(true); setResult(null);

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/marketing/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ subject, message, segment }),
    });
    const data = await res.json();
    setResult(data);
    setSending(false);
    if (data.sent) { setSubject(""); setMessage(""); }
  };

  return (
    <AdminShell>
      <h1 style={{ fontFamily: "var(--font-inria)", fontSize: "2rem", fontWeight: 400, marginBottom: "0.5rem" }}>Marketing</h1>
      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#888", marginBottom: "2rem" }}>Send email campaigns to your customers.</p>

      <div className="r-content-380">

        {/* Compose */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.75rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.5rem" }}>Compose Email</p>
          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={lbl}>Subject Line</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="New arrivals just dropped 🔥" style={inp} />
            </div>
            <div>
              <label style={lbl}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={10}
                placeholder={"Hey,\n\nWe just dropped our newest collection and we think you'll love it.\n\nHead to the shop to see what's new."}
                style={{ ...inp, resize: "vertical" }}
              />
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#bbb", marginTop: "0.35rem" }}>Each line break becomes a new paragraph. A Shop Now button is added automatically.</p>
            </div>
            <div>
              <label style={lbl}>Recipients</label>
              <select value={segment} onChange={(e) => setSegment(e.target.value)} style={inp}>
                <option value="all">All customers (everyone who ordered)</option>
                <option value="recent">Recent customers (ordered in last 60 days)</option>
              </select>
            </div>
            {result?.error && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#c00" }}>{result.error}</p>}
            {result?.sent && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#2e7d32" }}>✓ Sent to {result.sent} customer{result.sent !== 1 ? "s" : ""}.</p>}
            <button type="submit" disabled={sending}
              style={{ backgroundColor: "#000", color: "#fff", border: "none", padding: "0.85rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", opacity: sending ? 0.6 : 1 }}>
              {sending ? "Sending..." : "Send Campaign"}
            </button>
          </form>
        </div>

        {/* Tips */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", padding: "1.5rem" }}>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem" }}>Tips</p>
            {[
              ["Keep it short", "2–4 short paragraphs. People skim emails."],
              ["Strong subject", "Use urgency or curiosity — 'New drop', 'Limited stock', 'For you'."],
              ["One clear action", "The Shop Now button is your CTA — lead everything toward it."],
              ["Segment wisely", "Recent customers convert better. Use the filter for sale campaigns."],
            ].map(([title, tip]) => (
              <div key={title} style={{ marginBottom: "0.85rem" }}>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em", color: "#000", marginBottom: "2px" }}>{title}</p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#888", lineHeight: 1.6 }}>{tip}</p>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5", padding: "1.25rem" }}>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", color: "#888", lineHeight: 1.7 }}>
              Emails are sent via Resend. Free tier: <strong>3,000/month</strong>, 100/day. Upgrade at resend.com if you need more.
            </p>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
