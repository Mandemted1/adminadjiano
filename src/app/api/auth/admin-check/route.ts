import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json(null, { status: 403 });
  return NextResponse.json(admin);
}
