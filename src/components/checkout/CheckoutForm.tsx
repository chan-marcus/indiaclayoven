"use client";

/* eslint-disable react-hooks/purity --
   The only impure calls here are timestamps (Date.now / new Date) inside the
   submit event handler, which runs on click rather than during render. */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useRestaurantData } from "@/lib/restaurant-data";
import { currency } from "@/lib/format";
import { restaurant } from "@/lib/data/restaurant";
import { saveOrder, nextOrderNumber } from "@/lib/order-store";
import type { Order, OrderTiming, OrderType } from "@/lib/types";
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

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, tax, total, deliveryFee, clear, count } = useCart();
  const { addOrder, settings } = useRestaurantData();
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
    date: todayISO(),
    time: slots[0] ?? "",
    notes: "",
    card: "",
    expiry: "",
    cvc: "",
    zip: "",
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
    if (!form.card.trim()) e.card = "Enter a card number.";
    if (!form.expiry.trim()) e.expiry = "Required.";
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
    // Simulated payment + order submission.
    await new Promise((r) => setTimeout(r, 1400));

    const requestedFor =
      timing === "asap"
        ? new Date(Date.now() + (isDelivery ? 45 : 25) * 60_000).toISOString()
        : new Date(`${form.date}T12:00:00`).toISOString();

    const order: Order = {
      id: `ord_${Date.now()}`,
      restaurantId: restaurant.id,
      number: nextOrderNumber(),
      placedAt: new Date().toISOString(),
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: isDelivery ? form.address.trim() : undefined,
      },
      type,
      timing,
      requestedFor,
      items: lines.map((l) => ({
        itemId: l.itemId,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        notes: l.notes,
      })),
      subtotal,
      tax,
      deliveryFee: isDelivery ? deliveryFee : 0,
      total: grand,
      status: "new",
      // Mirrors the owner's current fax setting.
      fax: settings.fax.enabled
        ? {
            status: "sent",
            detail: `Sent ${new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}`,
            attempts: 1,
          }
        : { status: "disabled", detail: "Fax delivery is off", attempts: 0 },
      notes: form.notes.trim() || undefined,
    };

    // Human-readable scheduled time.
    if (timing === "scheduled") {
      order.requestedFor = new Date(`${form.date}T00:00:00`).toISOString();
      order.notes = [order.notes, `Scheduled for ${form.time}`].filter(Boolean).join(" · ");
    }

    saveOrder(order);
    addOrder(order); // lands on the owner's Orders screen
    clear();
    router.push("/order/confirmation");
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
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="field-label">
                    Delivery address
                  </label>
                  <input id="address" value={form.address} onChange={set("address")} className="field-input" autoComplete="street-address" placeholder="Street, apartment, city" />
                  {err("address")}
                </div>
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
                    <label htmlFor="zip" className="field-label">
                      ZIP
                    </label>
                    <input id="zip" value={form.zip} onChange={set("zip")} className="field-input" placeholder="94121" />
                  </div>
                </div>
              </div>

              <p className="mt-4 flex items-start gap-2 border-t border-cream-200 pt-4 text-xs leading-relaxed text-ink-500">
                <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This is an approval prototype. No card is charged and no details are stored or
                sent anywhere.
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
