import "server-only";
import { RESTAURANT_TIME_ZONE } from "@/lib/restaurant";
import type { Order, Restaurant } from "@/lib/types";

/*
 * The email the restaurant receives for every new order, sent through Resend
 * (https://resend.com). Needs RESEND_API_KEY; ORDER_EMAIL_FROM sets the sender
 * and must use a domain verified in Resend.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const money = (n: number) => `$${n.toFixed(2)}`;

const localTime = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("en-US", { timeZone: RESTAURANT_TIME_ZONE, ...opts });

function whenLine(order: Order) {
  if (order.timing === "asap") {
    return `As soon as possible, around ${localTime(order.requestedFor, { hour: "numeric", minute: "2-digit" })}`;
  }
  // Scheduled orders carry the chosen time in their notes ("Scheduled for 7:30 PM").
  return `Scheduled for ${localTime(order.requestedFor, { weekday: "long", month: "long", day: "numeric" })}`;
}

export function buildOrderEmail(order: Order, restaurant: Restaurant) {
  const kind = order.type === "pickup" ? "Pickup" : "Delivery";
  const subject = `New order #${order.number} · ${kind} · ${money(order.total)}`;
  const placed = localTime(order.placedAt, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });

  const rows: [string, string][] = [
    ["Order", `#${order.number} · ${kind}`],
    ["Placed", placed],
    ["Wanted", whenLine(order)],
    ["Customer", order.customer.name],
    ["Phone", order.customer.phone],
    ["Email", order.customer.email],
    ...(order.customer.address ? [["Deliver to", order.customer.address] as [string, string]] : []),
  ];

  const totals: [string, number][] = [
    ["Subtotal", order.subtotal],
    ...(order.deliveryFee > 0 ? [["Delivery", order.deliveryFee] as [string, number]] : []),
    ["Tax", order.tax],
  ];

  const cell = "padding:6px 0;vertical-align:top;font-size:15px;";
  const html = `<!doctype html>
<html><body style="margin:0;background:#fbf7f1;font-family:Arial,Helvetica,sans-serif;color:#1a1512;">
<div style="max-width:560px;margin:0 auto;padding:28px 20px;">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b4832f;">${esc(restaurant.name)}</p>
  <h1 style="margin:0 0 20px;font-size:24px;font-weight:normal;">New ${kind.toLowerCase()} order #${order.number}</h1>

  <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="${cell}width:110px;color:#7a6f66;">${k}</td><td style="${cell}">${esc(v)}</td></tr>`,
      )
      .join("\n    ")}
  </table>

  <table role="presentation" style="width:100%;border-collapse:collapse;border-top:1px solid #e6ddd0;">
    ${order.items
      .map(
        (i) => `<tr>
      <td style="${cell}border-bottom:1px solid #efe8dd;padding:10px 0;">
        <strong>${i.quantity}×</strong> ${esc(i.name)}${i.notes ? `<br><span style="font-size:13px;color:#7a6f66;font-style:italic;">“${esc(i.notes)}”</span>` : ""}
      </td>
      <td style="${cell}border-bottom:1px solid #efe8dd;padding:10px 0;text-align:right;white-space:nowrap;">${money(i.price * i.quantity)}</td>
    </tr>`,
      )
      .join("\n    ")}
    ${totals
      .map(
        ([k, v]) =>
          `<tr><td style="${cell}color:#7a6f66;">${k}</td><td style="${cell}text-align:right;">${money(v)}</td></tr>`,
      )
      .join("\n    ")}
    <tr><td style="${cell}font-weight:bold;font-size:17px;border-top:1px solid #e6ddd0;padding-top:10px;">Total</td>
        <td style="${cell}font-weight:bold;font-size:17px;border-top:1px solid #e6ddd0;padding-top:10px;text-align:right;">${money(order.total)}</td></tr>
  </table>

  ${order.notes ? `<p style="margin:20px 0 0;padding:12px 14px;background:#f3ece2;font-size:14px;"><strong>Note for the kitchen:</strong> ${esc(order.notes)}</p>` : ""}

  <p style="margin:24px 0 0;font-size:13px;color:#7a6f66;">Reply to this email to reach ${esc(order.customer.name)} directly.</p>
</div>
</body></html>`;

  const text = [
    `New ${kind.toLowerCase()} order #${order.number}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    ...order.items.map(
      (i) => `${i.quantity}x ${i.name}  ${money(i.price * i.quantity)}${i.notes ? `\n   "${i.notes}"` : ""}`,
    ),
    "",
    ...totals.map(([k, v]) => `${k}: ${money(v)}`),
    `Total: ${money(order.total)}`,
    ...(order.notes ? ["", `Note for the kitchen: ${order.notes}`] : []),
  ].join("\n");

  return { subject, html, text };
}

export type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendOrderEmail(order: Order, restaurant: Restaurant): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "Email service not set up" };

  const to = restaurant.orderEmail.addresses;
  if (to.length === 0) return { ok: false, reason: "No address to send to" };

  const { subject, html, text } = buildOrderEmail(order, restaurant);
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
