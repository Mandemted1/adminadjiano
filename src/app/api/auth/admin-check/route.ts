import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json(null, { status: 400 });

  const { data } = await getSupabaseAdmin()
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) return NextResponse.json(null, { status: 403 });
  return NextResponse.json(data);
}
