"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) { setError("Invalid credentials."); setLoading(false); return; }

    // Check admin_users table via API route (server-side)
    const res = await fetch("/api/auth/admin-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authData.session.access_token}`,
      },
    });

    if (!res.ok) {
      await supabase.auth.signOut();
      setError("You do not have admin access.");
      setLoading(false);
      return;
    }

    const adminData = await res.json();
    router.replace(adminData.role === "staff" ? "/orders" : "/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "380px", padding: "0 1.5rem" }}>
        <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "13px", fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase", color: "#fff" }}>ADJIANO</p>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginTop: "4px" }}>Admin Dashboard</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
            style={{ width: "100%", backgroundColor: "#111", border: "1px solid #222", padding: "0.9rem 1rem", fontFamily: "var(--font-montserrat)", fontSize: "11px", letterSpacing: "0.08em", color: "#fff", outline: "none" }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
            style={{ width: "100%", backgroundColor: "#111", border: "1px solid #222", padding: "0.9rem 1rem", fontFamily: "var(--font-montserrat)", fontSize: "11px", letterSpacing: "0.08em", color: "#fff", outline: "none" }} />
          {error && <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "#c00", letterSpacing: "0.06em" }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", backgroundColor: "#fff", color: "#000", padding: "0.9rem", fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", border: "none", cursor: "pointer", marginTop: "0.5rem", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
