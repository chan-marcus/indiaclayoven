"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/dashboard-data";
import { currency, orderNo } from "@/lib/format";
import { RelativeTime } from "@/components/dashboard/RelativeTime";
import { EmailStatus } from "@/components/dashboard/EmailStatus";
import { IconArrowRight } from "@/components/ui/icons";

export default function OverviewPage() {
  const { orders, items } = useDashboard();

  const today = orders.length;
  const openOrders = orders.filter((o) => o.status === "new" || o.status === "in_progress");
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const soldOut = items.filter((i) => !i.available);
  const emailTrouble = orders.filter((o) => o.emailDelivery.status === "failed");

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl">Today at a glance</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-500">
        Everything coming in through your website, in one place.
      </p>

      {/* Lightweight, clearly secondary stats */}
      <dl className="mt-7 grid gap-px overflow-hidden rounded-sm border border-cream-300 bg-cream-300 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Orders today", value: String(today) },
          { label: "Still to make", value: String(openOrders.length) },
          { label: "Sales today", value: currency(revenue) },
          { label: "Items sold out", value: String(soldOut.length) },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5">
            <dt className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink-400 uppercase">
              {s.label}
            </dt>
            <dd className="mt-2 font-display text-3xl tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      {emailTrouble.length > 0 && (
        <div className="mt-7">
          <h2 className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink-400 uppercase">
            Needs your attention
          </h2>
          <div className="mt-3 space-y-2">
            {emailTrouble.map((o) => (
              <div key={o.id} className="rounded-sm border border-cream-300 bg-white p-4">
                <p className="mb-2.5 text-[0.9375rem] font-medium">
                  Order {orderNo(o.number)} · {o.customer.name}
                </p>
                <EmailStatus order={o} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming orders */}
      <div className="mt-9 flex items-end justify-between">
        <h2 className="font-display text-2xl">Incoming orders</h2>
        <Link
          href="/dashboard/orders"
          className="group inline-flex items-center gap-2 text-[0.8125rem] font-medium text-gold"
        >
          See all orders
          <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-4 divide-y divide-cream-200 overflow-hidden rounded-sm border border-cream-300 bg-white">
        {orders.slice(0, 4).map((o) => (
          <Link
            key={o.id}
            href="/dashboard/orders"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 p-4 transition-colors hover:bg-cream-100/60"
          >
            <span className="font-display text-lg tabular-nums">{orderNo(o.number)}</span>
            <span className="text-[0.9375rem]">{o.customer.name}</span>
            <span className="text-[0.8125rem] text-ink-500 capitalize">{o.type}</span>
            <span className="text-[0.8125rem] text-ink-400"><RelativeTime iso={o.placedAt} /></span>
            <span className="ml-auto text-[0.9375rem] font-medium tabular-nums">
              {currency(o.total)}
            </span>
          </Link>
        ))}
      </div>

      {/* The pitch, stated plainly */}
      <div className="mt-9 rounded-sm border border-cream-300 bg-white p-6">
        <h2 className="font-display text-xl">You can run this yourself</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-500">
          Change a price, mark tonight&apos;s special sold out, or add a dish. It goes live on your
          website straight away. No developer, no waiting.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard/menu" className="btn btn-primary btn-sm">
            Manage my menu
          </Link>
          <Link href="/dashboard/settings" className="btn btn-secondary btn-sm">
            Restaurant settings
          </Link>
        </div>
      </div>
    </div>
  );
}
