import type { Choice, Order } from "@/lib/types";

/** What the customer picked, e.g. "Mild" or "Hot, Garlic Naan". */
export const choiceText = (choices?: Choice[]) => (choices ?? []).map((c) => c.choice).join(", ");

/** "1255 Taraval St, Apt 304, San Francisco 94115" for a delivery order. */
export const deliveryAddress = ({ address, apt, city, zip }: Order["customer"]) =>
  address
    ? [address, apt && `Apt ${apt}`, [city, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")
    : "";

/** Order numbers read as "#00001". */
export const orderNo = (n: number) => `#${String(n).padStart(5, "0")}`;

export const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const timeOfDay = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const dayAndTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** "12 minutes ago". Keeps the orders dashboard feeling live. */
export const relativeTime = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
};
