import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-guard";



function buildEmail(order: {
  id: string;
  status: string;
  guest_email?: string | null;
  total: number;
  order_items?: { name: string; quantity: number; price: number }[];
  shipping_address?: { name?: string } | null;
}) {
  const statusMessages: Record<string, { subject: string; headline: string; body: string }> = {
    in_transit: {
      subject: `Your Adjiano order is on its way!`,
      headline: "Your order is on its way 🚚",
      body: "Great news — your order has been picked up and is heading to you. You'll receive it soon.",
    },
    delivered: {
      subject: `Your Adjiano order has been delivered`,
      headline: "Order delivered ✓",
      body: "Your order has been delivered. We hope you love it. Thank you for shopping with Adjiano.",
    },
    cancelled: {
      subject: `Your Adjiano order has been cancelled`,
      headline: "Order cancelled",
      body: "Your order has been cancelled. If you have any questions, please contact us.",
    },
  };

  const msg = statusMessages[order.status];
  if (!msg) return null;

  const orderNum = order.id.slice(0, 8).toUpperCase();
  const itemsHtml = (order.order_items ?? [])
    .map((i) => `<tr>
      <td style="padding:8px 0;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0">${i.name}${i.quantity > 1 ? ` × ${i.quantity}` : ""}</td>
      <td style="padding:8px 0;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #f0f0f0">GHS ${i.price * i.quantity}</td>
    </tr>`).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e5e5e5">

        <!-- Header -->
        <tr><td style="padding:32px 40px;border-bottom:1px solid #f0f0f0;text-align:center">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.4em;text-transform:uppercase;color:#000">ADJIANO</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 40px 32px">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:400;color:#000">${msg.headline}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6">${msg.body}</p>

          <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#888">Order #${orderNum}</p>

          ${itemsHtml ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">${itemsHtml}</table>` : ""}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:2px solid #000;padding-top:12px">
            <tr>
              <td style="font-size:13px;font-weight:600;color:#000">Total</td>
              <td style="font-size:13px;font-weight:600;color:#000;text-align:right">GHS ${order.total}</td>
            </tr>
          </table>

          <div style="margin-top:32px;text-align:center">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://adjiano.com"}/track-order" style="display:inline-block;background:#000;color:#fff;padding:14px 32px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none">
              Track Order
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center">
          <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.08em">© Adjiano. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: msg.subject, html };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  // Update status in DB
  const { error: updateErr } = await getSupabaseAdmin()
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Fetch full order for email
  const { data: order } = await getSupabaseAdmin()
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (!order) return NextResponse.json({ ok: true });

  // Get customer email
  let toEmail = order.guest_email;
  if (!toEmail && order.user_id) {
    const { data: profile } = await getSupabaseAdmin()
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();
    toEmail = profile?.email ?? null;
  }

  // Send email if we have an address and status warrants it
  if (toEmail) {
    const email = buildEmail(order);
    if (email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Adjiano <orders@adjiano.com>",
        to: toEmail,
        subject: email.subject,
        html: email.html,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
