import "server-only";
import { orderNo } from "@/lib/format";
import { buildOrderTicket } from "@/lib/ticket";
import type { CardDetails, Order, Restaurant } from "@/lib/types";

/*
 * The order email, sent alongside the fax through Resend (https://resend.com).
 * Needs RESEND_API_KEY; ORDER_EMAIL_FROM sets the sender and must use a
 * domain verified in Resend. It's the same plain ticket the fax prints, in
 * monospace with no colour, so it prints cleanly too.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildOrderEmail(order: Order, card?: CardDetails) {
  const kind = order.type === "pickup" ? "Pickup" : "Delivery";
  const subject = `New order ${orderNo(order.number)} · ${kind} · $${order.total.toFixed(2)}`;
  const text = buildOrderTicket(order, card).join("\n");
  const html = `<!doctype html>
<html><body style="margin:0;background:#fff;color:#000;">
<pre style="margin:0;padding:16px;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:1.4;white-space:pre-wrap;">${esc(text)}</pre>
</body></html>`;
  return { subject, html, text };
}

export type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendOrderEmail(
  order: Order,
  restaurant: Restaurant,
  card?: CardDetails,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "Email service not set up" };

  const to = restaurant.orderEmail.addresses;
  if (to.length === 0) return { ok: false, reason: "No address to send to" };

  const { subject, html, text } = buildOrderEmail(order, card);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM || `${restaurant.name} <onboarding@resend.dev>`,
        to,
        reply_to: order.customer.email,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    console.error("Resend rejected order email", res.status, body);
    return { ok: false, reason: body?.message?.slice(0, 120) || `Email service error ${res.status}` };
  } catch (err) {
    console.error("Order email failed", err);
    return { ok: false, reason: "Could not reach the email service" };
  }
}
