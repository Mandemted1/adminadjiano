import { createClient } from "@supabase/supabase-js";

// Returns a fresh client — only call this inside request handlers, never at module level
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
