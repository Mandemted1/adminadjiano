"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import type { AdminUser } from "@/lib/types";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin]       = useState<AdminUser | null>(null);
  const [loading, setLoading]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const res = await fetch("/api/auth/admin-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) { await supabase.auth.signOut(); router.replace("/login"); return; }

      const data: AdminUser = await res.json();

      // Staff can only access /orders
      if (data.role === "staff" && !pathname.startsWith("/orders")) {
        router.replace("/orders");
        return;
      }

      setAdmin(data);
      setLoading(false);
    })();
  }, [router, pathname]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", letterSpacing: "0.2em", color: "#444" }}>LOADING...</p>
    </div>
  );

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      <div
        className={`admin-sidebar-overlay${menuOpen ? " overlay-open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Sidebar */}
      <div className={`admin-sidebar-wrapper${menuOpen ? " sidebar-open" : ""}`}>
        <Sidebar role={admin!.role} email={admin!.email} onClose={() => setMenuOpen(false)} />
      </div>

      {/* Content area */}
      <div className="admin-content-area">
        {/* Mobile top bar */}
        <div className="admin-topbar">
          <button
            onClick={() => setMenuOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", padding: "0.25rem" }}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#fff" }}>
            ADJIANO
          </p>
        </div>

        {/* Page content */}
        <main className="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
