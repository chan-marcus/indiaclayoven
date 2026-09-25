"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { currency } from "@/lib/format";
import { saveOrder } from "@/lib/order-store";
import { placeOrder } from "@/app/actions";
import { unwrap } from "@/lib/action-result";
import { EMAIL_FULL_CARD } from "@/lib/prototype";
import type { OrderTiming, OrderType } from "@/lib/types";
import { IconBag, IconCheck, IconLock } from "@/components/ui/icons";

/** Next few half-hour slots, for "schedule for later". */
function useTimeSlots() {
  return useMemo(() => {
    const slots: string[] = [];
    const d = new Date();
    d.setMinutes(d.getMinutes() + 45);
    d.setMinutes(d.getMinutes() > 30 ? 60 : 30, 0, 0);
    for (let i = 0; i < 16; i++) {
      slots.push(
        d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      );
      d.setMinutes(d.getMinutes() + 30);
    }
    return slots;
  }, []);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

/** "2026-05-24" + "7:30 PM" as a real instant in the customer's time zone. */
function scheduledAt(date: string, slot: string) {
  const [, h, m, pm] = slot.match(/(\d+):(\d+)\s*(PM)?/i) ?? [];
  const d = new Date(`${date}T00:00:00`);
  d.setHours((Number(h) % 12) + (pm ? 12 : 0), Number(m));
  return d.toISOString();
}

function cardBrand(digits: string) {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6/.test(digits)) return "Discover";
  return "Card";
}

/** "0629", "6/29" or "06/2029" as "06/29". */
function normalExpiry(v: string) {
  const [, mm, yy] = v.replace(/\s/g, "").match(/^(\d{1,2})\/?(\d{2}|\d{4})$/) ?? [];
  return mm ? `${mm.padStart(2, "0")}/${yy.slice(-2)}` : "";
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, tax, total, deliveryFee, clear, count } = useCart();
  const slots = useTimeSlots();

  const [type, setType] = useState<OrderType>("pickup");
  const [timing, setTiming] = useState<OrderTiming>("asap");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    apt: "",
    city: "",
    zip: "",
    crossStreet: "",
    date: todayISO(),
    time: slots[0] ?? "",
    notes: "",
    card: "",
    expiry: "",
    cvc: "",
    billingZip: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const isDelivery = type === "delivery";
  const grand = total({ delivery: isDelivery });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please tell us who the order is for.";
    if (!form.phone.trim()) e.phone = "We need a phone number in case the kitchen has a question.";
    if (!form.email.trim()) e.email = "Add an email for your receipt.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "That email does not look right.";
    if (isDelivery && !form.address.trim()) e.address = "Where are we delivering to?";
    if (isDelivery && !form.city.trim()) e.city = "Required.";
    if (isDelivery && !form.zip.trim()) e.zip = "Required.";
    if (form.card.replace(/\D/g, "").length < 12) e.card = "Enter a card number.";
    if (!normalExpiry(form.expiry)) e.expiry = "Use MM/YY.";
    if (!form.cvc.trim()) e.cvc = "Required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      // Send focus to the first problem so the error is never off-screen.
      const first = document.querySelector<HTMLElement>("[data-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);

    const requestedFor =
      timing === "asap"
        ? new Date(Date.now() + (isDelivery ? 45 : 25) * 60_000).toISOString()
        : scheduledAt(form.date, form.time);
    const digits = form.card.replace(/\D/g, "");

    try {
      // Payment is still simulated; the order itself is saved for real.
      const order = unwrap(
        await placeOrder({
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          ...(isDelivery && {
            address: form.address.trim(),
            apt: form.apt.trim(),
            city: form.city.trim(),
            zip: form.zip.trim(),
            crossStreet: form.crossStreet.trim(),
          }),
        },
        // Only this summary is saved. The full card is sent only in the
        // prototype, for the order email.
        payment: {
          brand: cardBrand(digits),
          last4: digits.slice(-4),
          expiry: normalExpiry(form.expiry),
          billingZip: form.billingZip.trim(),
        },
        ...(EMAIL_FULL_CARD && { card: { number: digits, cvc: form.cvc.trim() } }),
        type,
        timing,
        requestedFor,
          items: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, notes: l.notes })),
          notes: form.notes.trim(),
        }),
      );
      saveOrder(order);
      clear();
      router.push("/order/confirmation");
    } catch (err) {
      setSubmitting(false);
      setErrors({ submit: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    }
  };

  if (count === 0) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cream-300 text-ink-400">
            <IconBag className="h-6 w-6" />
          </span>
          <h1 className="display-md mt-6">Your order is empty</h1>
          <p className="mt-3 text-ink-500">
            Add a few dishes from the clay oven and come back to check out.
          </p>
          <Link href="/menu" className="btn btn-primary mt-7">
            Browse the menu
          </Link>
        </div>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? (
      <p data-error="true" className="mt-1.5 text-xs text-danger">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} className="container-page py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
        {/* ---------------- Left: the form ---------------- */}
        <div className="min-w-0 space-y-10">
          {/* Order type */}
          <section>
            <h2 className="font-display text-2xl">How would you like it?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  { v: "pickup", label: "Pickup", sub: "Ready in about 25 min" },
                  { v: "delivery", label: "Delivery", sub: `${currency(deliveryFee)} · about 45 min` },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setType(o.v)}
                  aria-pressed={type === o.v}
                  className={`rounded-sm border p-4 text-left transition-colors duration-200 ${
                    type === o.v
                      ? "border-clay bg-clay/5"
                      : "border-cream-300 hover:border-earth"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-medium">{o.label}</span>
                    {type === o.v && <IconCheck className="h-4 w-4 text-clay" />}
                  </span>
                  <span className="mt-1 block text-[0.8125rem] text-ink-500">{o.sub}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Customer */}
          <section>
            <h2 className="font-display text-2xl">Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="field-label">
                  Name
                </label>
                <input id="name" value={form.name} onChange={set("name")} className="field-input" autoComplete="name" />
                {err("name")}
              </div>
              <div>
                <label htmlFor="phone" className="field-label">
                  Phone
                </label>
                <input id="phone" value={form.phone} onChange={set("phone")} className="field-input" inputMode="tel" autoComplete="tel" placeholder="(415) 555-0100" />
                {err("phone")}
              </div>
              <div>
                <label htmlFor="email" className="field-label">
                  Email
                </label>
                <input id="email" value={form.email} onChange={set("email")} className="field-input" inputMode="email" autoComplete="email" placeholder="you@example.com" />
                {err("email")}
              </div>
              {isDelivery && (
                <>
                  <div>
                    <label htmlFor="address" className="field-label">
                      Street address
                    </label>
                    <input id="address" value={form.address} onChange={set("address")} className="field-input" autoComplete="address-line1" placeholder="1255 Taraval St" />
                    {err("address")}
                  </div>
                  <div>
                    <label htmlFor="apt" className="field-label">
                      Apt / unit <span className="normal-case">(optional)</span>
                    </label>
                    <input id="apt" value={form.apt} onChange={set("apt")} className="field-input" autoComplete="address-line2" />
                  </div>
                  <div>
                    <label htmlFor="city" className="field-label">
                      City
                    </label>
                    <input id="city" value={form.city} onChange={set("city")} className="field-input" autoComplete="address-level2" placeholder="San Francisco" />
                    {err("city")}
                  </div>
                  <div>
                    <label htmlFor="zip" className="field-label">
                      ZIP
                    </label>
                    <input id="zip" value={form.zip} onChange={set("zip")} className="field-input" inputMode="numeric" autoComplete="postal-code" placeholder="94116" />
                    {err("zip")}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="crossStreet" className="field-label">
                      Cross street <span className="normal-case">(optional)</span>
                    </label>
                    <input id="crossStreet" value={form.crossStreet} onChange={set("crossStreet")} className="field-input" placeholder="23rd Ave" />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Timing */}
          <section>
            <h2 className="font-display text-2xl">When?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  { v: "asap", label: "As soon as possible" },
                  { v: "scheduled", label: "Schedule for later" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setTiming(o.v)}
                  aria-pressed={timing === o.v}
                  className={`rounded-sm border p-4 text-left text-[0.9375rem] font-medium transition-colors duration-200 ${
                    timing === o.v ? "border-clay bg-clay/5" : "border-cream-300 hover:border-earth"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {timing === "scheduled" && (
              <div className="mt-4 grid animate-rise gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="date" className="field-label">
                    Date
                  </label>
                  <input id="date" type="date" min={todayISO()} value={form.date} onChange={set("date")} className="field-input" />
                </div>
                <div>
                  <label htmlFor="time" className="field-label">
                    Time
                  </label>
                  <select id="time" value={form.time} onChange={set("time")} className="field-input">
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Kitchen notes */}
          <section>
            <h2 className="font-display text-2xl">Anything else?</h2>
            <div className="mt-4">
              <label htmlFor="notes" className="field-label">
                Notes for the kitchen <span className="normal-case">(optional)</span>
              </label>
              <textarea id="notes" value={form.notes} onChange={set("notes")} rows={3} className="field-input" placeholder="Allergies, spice level, gluten free, parking…" />
            </div>
          </section>

          {/* Payment */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Payment</h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
                <IconLock className="h-4 w-4 text-success" />
                Encrypted
              </span>
            </div>

            <div className="mt-4 rounded-sm border border-cream-300 bg-white p-5">
              <div className="grid gap-4">
                <div>
                  <label htmlFor="card" className="field-label">
                    Card number
                  </label>
                  <input id="card" value={form.card} onChange={set("card")} className="field-input" inputMode="numeric" placeholder="4242 4242 4242 4242" />
                  {err("card")}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="expiry" className="field-label">
                      Expiry
                    </label>
                    <input id="expiry" value={form.expiry} onChange={set("expiry")} className="field-input" placeholder="MM/YY" />
                    {err("expiry")}
                  </div>
                  <div>
                    <label htmlFor="cvc" className="field-label">
                      CVC
                    </label>
                    <input id="cvc" value={form.cvc} onChange={set("cvc")} className="field-input" placeholder="123" />
                    {err("cvc")}
                  </div>
                  <div>
                    <label htmlFor="billingZip" className="field-label">
                      Billing ZIP
                    </label>
                    <input id="billingZip" value={form.billingZip} onChange={set("billingZip")} className="field-input" inputMode="numeric" placeholder="94121" />
                  </div>
                </div>
              </div>

              <p className="mt-4 flex items-start gap-2 border-t border-cream-200 pt-4 text-xs leading-relaxed text-ink-500">
                <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {EMAIL_FULL_CARD
                  ? "Prototype: no card is charged, and the full card number and security code are emailed to the restaurant with the order. Use a test card, never a real one."
                  : "No card is charged yet. The restaurant only sees your card type, last four digits, expiry and billing ZIP; the full number and security code never leave this page."}
              </p>
            </div>
          </section>
        </div>

        {/* ---------------- Right: summary ---------------- */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-sm border border-cream-200 bg-white">
            <div className="border-b border-cream-200 px-5 py-4">
              <h2 className="font-display text-xl">Your order</h2>
            </div>

            <ul className="max-h-72 divide-y divide-cream-200 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.lineId} className="flex gap-3 py-3.5">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-cream-100">
                    <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-medium">
                      <span className="text-ink-500 tabular-nums">{l.quantity}×</span> {l.name}
                    </p>
                    {l.notes && (
                      <p className="mt-0.5 text-xs text-ink-500 italic">“{l.notes}”</p>
                    )}
                    <p className="mt-0.5 text-xs tabular-nums text-ink-500">
                      {currency(l.price * l.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-cream-200 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="tabular-nums">{currency(subtotal)}</dd>
              </div>
              {isDelivery && (
                <div className="flex justify-between">
                  <dt className="text-ink-500">Delivery</dt>
                  <dd className="tabular-nums">{currency(deliveryFee)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-500">Tax</dt>
                <dd className="tabular-nums">{currency(tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-cream-300 pt-2.5 text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{currency(grand)}</dd>
              </div>
            </dl>

            <div className="px-5 pb-5">
              <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
                {submitting ? "Placing your order…" : `Place order · ${currency(grand)}`}
              </button>
              {errors.submit && (
                <p data-error="true" role="alert" className="mt-3 text-sm text-danger">
                  {errors.submit}
                </p>
              )}
              <Link
                href="/menu"
                className="mt-3 block text-center text-[0.8125rem] text-ink-500 underline-offset-4 hover:text-ink hover:underline"
              >
                Add more dishes
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
