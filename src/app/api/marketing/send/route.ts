import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { subject, message, segment } = await req.json();
  if (!subject || !message) return NextResponse.json({ error: "Subject and message required" }, { status: 400 });

  // Collect all customer emails
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("guest_email, user_id, status, created_at")
    .neq("status", "cancelled");

  // Get profile emails for account users
  const userIds = [...new Set((orders ?? []).filter((o) => o.user_id).map((o) => o.user_id))];
  const profileEmails: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const p of profiles ?? []) profileEmails[p.id] = p.email;
  }

  // Build unique email set
  const emailSet = new Set<string>();
  for (const o of orders ?? []) {
    const email = o.guest_email ?? profileEmails[o.user_id];
    if (email) {
      // Segment filter
      if (segment === "recent") {
        // ordered in last 60 days
        const orderDate = new Date(o.created_at);
        const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        if (orderDate >= cutoff) emailSet.add(email);
      } else {
        emailSet.add(email);
      }
    }
  }

  const recipients = Array.from(emailSet);
  if (recipients.length === 0) return NextResponse.json({ error: "No recipients found" }, { status: 400 });

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Adjiano <orders@adjiano.com>";
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adjiano.com";

  // Convert plain text message to HTML paragraphs
  const bodyHtml = message
    .split("\n")
    .filter((l: string) => l.trim())
    .map((l: string) => `<p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7">${l}</p>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e5e5e5">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #f0f0f0;text-align:center">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:#000">ADJIANO</p>
        </td></tr>
        <tr><td style="padding:40px 40px 32px">
          ${bodyHtml}
          <div style="margin-top:32px;text-align:center">
            <a href="${siteUrl}/collections" style="display:inline-block;background:#000;color:#fff;padding:14px 32px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none">
              Shop Now
            </a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center">
          <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.08em">© Adjiano. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Resend supports batch of up to 100 at a time
  const BATCH = 100;
  let sent = 0;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH).map((to) => ({
      from: fromEmail,
      to,
      subject,
      html,
    }));
    await resend.batch.send(batch);
    sent += batch.length;
  }

  return NextResponse.json({ sent });
}
