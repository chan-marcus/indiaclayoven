import "server-only";
import { choiceText, orderNo } from "@/lib/format";
import { RESTAURANT_TIME_ZONE } from "@/lib/restaurant";
import type { CardDetails, Order } from "@/lib/types";

/*
 * The order ticket the kitchen receives for every new order, both faxed
 * (lib/fax/telnyx.ts) and emailed (lib/email/order-email.ts).
 */

const money = (n: number) => `$${n.toFixed(2)}`;

/** Date and time parts in the restaurant's zone, e.g. { year: "2026", hour: "05", ... }. */
function localParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = get("hour");
  const pm = get("dayPeriod").toLowerCase() === "pm";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}:${get("second")}${pm ? "pm" : "am"}`,
    hour24: String((Number(hour) % 12) + (pm ? 12 : 0)).padStart(2, "0"),
    minute: get("minute"),
  };
}

const digits = (phone: string) => phone.replace(/\D/g, "") || phone;
const RULE = "-".repeat(57);

/** Customer-typed text on one line, so it can't add fake lines to the ticket. */
const one = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

function cardBrand(number: string) {
  if (/^4/.test(number)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(number)) return "Mastercard";
  if (/^3[47]/.test(number)) return "American Express";
  if (/^6/.test(number)) return "Discover";
  return "Card";
}

/** "4242424242424242" as "4242 4242 4242 4242" (American Express: 4-6-5). */
const groupCard = (n: string) =>
  (/^3[47]/.test(n) ? [n.slice(0, 4), n.slice(4, 10), n.slice(10)] : n.match(/.{1,4}/g) ?? [n])
    .filter(Boolean)
    .join(" ");

/*
 * Plain monospaced text in the layout the restaurant's old ordering system
 * used, ready to print: one line per row, nothing screen-only.
 */
export function buildOrderTicket(order: Order, card?: CardDetails): string[] {
  const c = order.customer;
  const placed = localParts(order.placedAt);
  const wanted = localParts(order.requestedFor);
  const phone = digits(c.phone);

  const lines = [
    order.type === "pickup" ? "TAKE OUT ORDER" : "DELIVERY ORDER",
    ...(order.timing === "scheduled"
      ? [`REQUESTED TIME & DATE- ${wanted.date}T${wanted.hour24}:${wanted.minute}.`]
      : []),
    "",
    `CALL ${phone} TO CONFIRM THIS ORDER.`,
    `ORDER ${orderNo(order.number)} SENT AT:${placed.time} ON ${placed.date}`,
    // TESTING ONLY: the full card, as typed. Only a new order's first fax and email
    // have it; a resend from the dashboard doesn't, because it's never stored.
    ...(card
      ? [
          `PAYMENT METHOD: ${cardBrand(card.number)}`,
          `   CC#: ${groupCard(card.number)} Expires:${card.expiry}`,
          ` CCIN-${card.cvc}`,
          ...(card.billingZip ? [` Billing Zip Code-${one(card.billingZip)}`] : []),
        ]
      : ["PAYMENT METHOD: Card (full details are on the first ticket)"]),
    `NAME: ${one(c.name)}`,
    ...(c.address
      ? [
          `ADDRESS: ${one(c.address)} APT: ${one(c.apt)}`,
          `CITY/TOWN: ${one(c.city)}  ZIP- ${one(c.zip)}`,
          ...(c.crossStreet ? [`X-STREET: ${one(c.crossStreet)}`] : []),
        ]
      : []),
    `PHONE: ${phone}  EMAIL: ${one(c.email)}`,
    ...(order.notes ? [`COMMENTS- ${one(order.notes)}`] : []),
    ...order.items.flatMap((i) => [
      RULE,
      `${String(i.quantity).padEnd(6)}${one(i.name)}${i.choices?.length ? `, ${one(choiceText(i.choices))}` : ""}${i.notes ? `, ${one(i.notes)}` : ""}, ${money(i.price * i.quantity)} @ ${money(i.price)}`,
    ]),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    ...(order.deliveryFee > 0 ? [`Delivery Fee: ${money(order.deliveryFee)}`] : []),
    `Sales Tax: ${money(order.tax)}`,
    `TOTAL- ${money(order.total)}`,
  ];

  return lines;
}
