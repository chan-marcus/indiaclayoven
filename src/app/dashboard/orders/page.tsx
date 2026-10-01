"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/dashboard-data";
import { choiceText, currency, timeOfDay, dayAndTime, deliveryAddress, orderNo } from "@/lib/format";
import { RelativeTime } from "@/components/dashboard/RelativeTime";
import { EmailStatus } from "@/components/dashboard/EmailStatus";
import type { Order, OrderStatus } from "@/lib/types";
import { IconClose } from "@/components/ui/icons";

const STATUSES: { v: OrderStatus; label: string; tone: string }[] = [
  { v: "new", label: "New", tone: "border-clay/35 bg-clay/8 text-clay" },
  { v: "in_progress", label: "In Progress", tone: "border-gold/40 bg-gold-soft/45 text-[#7a5716]" },
  { v: "ready", label: "Ready", tone: "border-success/30 bg-success/10 text-success" },
  { v: "completed", label: "Completed", tone: "border-cream-300 bg-cream-100 text-ink-500" },
];

const toneFor = (s: OrderStatus) => STATUSES.find((x) => x.v === s)!.tone;
const labelFor = (s: OrderStatus) => STATUSES.find((x) => x.v === s)!.label;

export default function OrdersPage() {
  const { orders, setOrderStatus } = useDashboard();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [open, setOpen] = useState<Order | null>(null);

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const current = open ? orders.find((o) => o.id === open.id) ?? null : null;

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl">Orders</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-500">
        New orders appear here the moment a customer checks out.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", ...STATUSES.map((s) => s.v)] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-xs border px-3 py-1.5 text-[0.8125rem] transition-colors ${
              filter === f
                ? "border-clay bg-clay text-cream"
                : "border-cream-300 bg-white text-ink-700 hover:border-earth"
            }`}
          >
            {f === "all" ? "All" : labelFor(f)}
            <span className="ml-1.5 tabular-nums opacity-60">
              {f === "all" ? orders.length : orders.filter((o) => o.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="mt-5 overflow-hidden rounded-sm border border-cream-300 bg-white">
        {/* Column headings, desktop only */}
        <div className="hidden grid-cols-[6rem_1fr_7rem_7rem_6rem_9rem] gap-4 border-b border-cream-200 bg-cream-100/60 px-4 py-2.5 text-[0.6875rem] font-medium tracking-[0.12em] text-ink-400 uppercase lg:grid">
          <span>Order</span>
          <span>Customer</span>
          <span>Time</span>
          <span>Type</span>
          <span>Total</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-cream-200">
          {shown.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOpen(o)}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left transition-colors hover:bg-cream-100/60 lg:grid lg:grid-cols-[6rem_1fr_7rem_7rem_6rem_9rem]"
            >
              <span className="font-display text-lg tabular-nums">{orderNo(o.number)}</span>
              <span className="text-[0.9375rem]">{o.customer.name}</span>
              <span className="text-[0.8125rem] text-ink-500"><RelativeTime iso={o.placedAt} /></span>
              <span className="text-[0.8125rem] text-ink-500 capitalize">{o.type}</span>
              <span className="text-[0.9375rem] font-medium tabular-nums">
                {currency(o.total)}
              </span>
              <span>
                <span
                  className={`inline-block rounded-xs border px-2 py-0.5 text-[0.6875rem] font-medium tracking-[0.08em] uppercase ${toneFor(
                    o.status,
                  )}`}
                >
                  {labelFor(o.status)}
                </span>
              </span>
            </button>
          ))}

          {shown.length === 0 && (
            <p className="p-8 text-center text-ink-500">Nothing here right now.</p>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {current && (
        <div className="fixed inset-0 z-70" role="dialog" aria-modal="true" aria-label={`Order ${orderNo(current.number)}`}>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(null)}
            className="absolute inset-0 animate-fade-in bg-ink/45"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(30rem,100vw)] animate-slide-in-right flex-col bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
              <div>
                <p className="font-display text-2xl tabular-nums">{orderNo(current.number)}</p>
                <p className="text-[0.8125rem] text-ink-500">
                  Placed <RelativeTime iso={current.placedAt} /> · {timeOfDay(current.placedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-xs hover:bg-cream-100"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {/* Status control */}
              <section>
                <h3 className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink-400 uppercase">
                  Status
                </h3>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => setOrderStatus(current.id, s.v)}
                      aria-pressed={current.status === s.v}
                      className={`rounded-xs border px-3 py-2.5 text-[0.8125rem] font-medium transition-colors ${
                        current.status === s.v
                          ? "border-clay bg-clay text-cream"
                          : "border-cream-300 bg-white text-ink-700 hover:border-earth"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Order email */}
              <section>
                <h3 className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink-400 uppercase">
                  Order email
                </h3>
                <div className="mt-2.5">
                  <EmailStatus order={current} />
                </div>
              </section>

              {/* Customer */}
              <section>
                <h3 className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink-400 uppercase">
                  Customer
                </h3>
                <dl className="mt-2.5 space-y-1.5 rounded-sm border border-cream-200 bg-white p-4 text-[0.9375rem]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Name</dt>
                    <dd>{current.customer.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Phone</dt>
                    <dd>{current.customer.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Email</dt>
                    <dd className="truncate">{current.customer.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Type</dt>
                    <dd className="capitalize">{current.type}</dd>
                  </div>
                  {current.customer.address && (
                    <div className="flex justify-between gap-4">
                      <dt className="shrink-0 text-ink-500">Address</dt>
                      <dd className="text-right">
                        {deliveryAddress(current.customer)}
                        {current.customer.crossStreet && (
                          <span className="block text-ink-500">Near {current.customer.crossStreet}</span>
                        )}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Requested</dt>
                    <dd className="text-right">
                      {current.timing === "asap" ? "ASAP" : dayAndTime(current.requestedFor)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Items */}
              <section>
                <h3 className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink-400 uppercase">
                  Items
                </h3>
                <ul className="mt-2.5 divide-y divide-cream-200 rounded-sm border border-cream-200 bg-white px-4">
                  {current.items.map((i, idx) => (
                    <li key={`${i.itemId}-${idx}`} className="flex justify-between gap-4 py-3">
                      <div>
                        <p className="text-[0.9375rem]">
                          <span className="text-ink-500 tabular-nums">{i.quantity}×</span> {i.name}
                        </p>
                        {i.choices?.length ? (
                          <p className="mt-0.5 text-[0.8125rem] font-medium text-ink-700">
                            {choiceText(i.choices)}
                          </p>
                        ) : null}
                        {i.notes && (
                          <p className="mt-0.5 text-xs text-ink-500 italic">“{i.notes}”</p>
                        )}
                      </div>
                      <p className="text-[0.9375rem] tabular-nums">
                        {currency(i.price * i.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                {current.notes && (
                  <p className="mt-3 rounded-sm border border-gold/25 bg-gold-soft/30 px-4 py-3 text-sm text-ink-700">
                    <span className="font-medium">Note:</span> {current.notes}
                  </p>
                )}
              </section>
            </div>

            <div className="border-t border-cream-300 bg-cream-100/60 px-5 py-4">
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span className="tabular-nums">{currency(current.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
