"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import type { AdminUser } from "@/lib/types";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const res = await fetch("/api/auth/admin-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
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
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role={admin!.role} email={admin!.email} />
      <main style={{ flex: 1, padding: "2.5rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
