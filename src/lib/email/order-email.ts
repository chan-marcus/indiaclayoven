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

export function buildOrderEmail(order: Order) {
  const kind = order.type === "pickup" ? "Pickup" : "Delivery";
  const subject = `New order #${order.number} · ${kind} · ${money(order.total)}`;
  const placed = localTime(order.placedAt, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });

  // Kitchens print these, so the layout is black on white with no tints and
  // nothing that only matters on screen.
  const rows: [string, string][] = [
    ["Placed", placed],
    ["Wanted", whenLine(order)],
    ["Customer", order.customer.name],
    ["Phone", order.customer.phone],
    ...(order.customer.address ? [["Deliver to", order.customer.address] as [string, string]] : []),
  ];

  const totals: [string, number][] = [
    ["Subtotal", order.subtotal],
    ...(order.deliveryFee > 0 ? [["Delivery", order.deliveryFee] as [string, number]] : []),
    ["Tax", order.tax],
  ];

  const cell = "padding:3px 0;vertical-align:top;font-size:14px;";
  const rule = "border-top:1px solid #000;";
  const html = `<!doctype html>
<html><body style="margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#000;">
<div style="max-width:560px;margin:0 auto;padding:16px;">
  <h1 style="margin:0 0 10px;font-size:20px;">${kind} order #${order.number}</h1>

  <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:10px;">
    ${rows
      .map(([k, v]) => `<tr><td style="${cell}width:90px;">${k}</td><td style="${cell}">${esc(v)}</td></tr>`)
      .join("\n    ")}
  </table>

  <table role="presentation" style="width:100%;border-collapse:collapse;${rule}">
    ${order.items
      .map(
        (i) => `<tr>
      <td style="${cell}"><strong>${i.quantity}×</strong> ${esc(i.name)}${i.notes ? `<br><em style="font-size:13px;">“${esc(i.notes)}”</em>` : ""}</td>
      <td style="${cell}text-align:right;white-space:nowrap;">${money(i.price * i.quantity)}</td>
    </tr>`,
      )
      .join("\n    ")}
    ${totals
      .map(
        ([k, v], n) =>
          `<tr><td style="${cell}${n === 0 ? rule : ""}">${k}</td><td style="${cell}${n === 0 ? rule : ""}text-align:right;">${money(v)}</td></tr>`,
      )
      .join("\n    ")}
    <tr><td style="${cell}${rule}font-weight:bold;font-size:16px;">Total</td>
        <td style="${cell}${rule}font-weight:bold;font-size:16px;text-align:right;">${money(order.total)}</td></tr>
  </table>

  ${order.notes ? `<p style="margin:10px 0 0;font-size:14px;"><strong>Kitchen note:</strong> ${esc(order.notes)}</p>` : ""}
</div>
</body></html>`;

  const text = [
    `${kind} order #${order.number}`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    ...order.items.map(
      (i) => `${i.quantity}x ${i.name}  ${money(i.price * i.quantity)}${i.notes ? `\n   "${i.notes}"` : ""}`,
    ),
    "",
    ...totals.map(([k, v]) => `${k}: ${money(v)}`),
    `Total: ${money(order.total)}`,
    ...(order.notes ? ["", `Kitchen note: ${order.notes}`] : []),
  ].join("\n");

  return { subject, html, text };
}

export type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendOrderEmail(order: Order, restaurant: Restaurant): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "Email service not set up" };

  const to = restaurant.orderEmail.addresses;
  if (to.length === 0) return { ok: false, reason: "No address to send to" };

  const { subject, html, text } = buildOrderEmail(order);
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
