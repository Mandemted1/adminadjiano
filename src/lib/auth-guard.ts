import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./supabase-server";
import type { AdminUser } from "./types";

/**
 * Verifies the Bearer token in the Authorization header, then checks
 * that the authenticated user is in the admin_users table.
 * Returns the AdminUser row, or null if unauthorized.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminUser | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;

  const db = getSupabaseAdmin();

  // Verify token with Supabase Auth
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;

  // Check admin_users table
  const { data } = await db
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as AdminUser) ?? null;
}
