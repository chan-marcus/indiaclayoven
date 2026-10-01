"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";
import { loadOrder } from "@/lib/order-store";
import { choiceText, currency, timeOfDay, dayAndTime, deliveryAddress, orderNo } from "@/lib/format";
import { fullAddress, mapsUrl, telHref } from "@/lib/restaurant";
import { useRestaurantData } from "@/lib/restaurant-data";
import { IconCheck, IconPhone, IconPin } from "@/components/ui/icons";

export function Confirmation() {
  const { settings: restaurant } = useRestaurantData();
  const [order, setOrder] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Reads the handed-off order from sessionStorage, unavailable during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(loadOrder());
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="container-page py-24 text-ink-500">Loading your order…</div>;
  }

  if (!order) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="display-md">No recent order</h1>
        <p className="mt-3 text-ink-500">
          We could not find an order in this session. Start a new one whenever you are hungry.
        </p>
        <Link href="/menu" className="btn btn-primary mt-7">
          Browse the menu
        </Link>
      </div>
    );
  }

  const when =
    order.timing === "asap"
      ? `As soon as possible, around ${timeOfDay(order.requestedFor)}`
      : dayAndTime(order.requestedFor);

  return (
    <div className="container-page py-14 lg:py-20">
      <div className="mx-auto max-w-2xl">
        {/* Confirmation banner */}
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success">
            <IconCheck className="h-8 w-8" />
          </span>
          <h1 className="display-md mt-7 text-balance">Thank you, your order has been received.</h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-500">
            We have sent a confirmation to{" "}
            <span className="text-ink">{order.customer.email}</span>. The kitchen is on it.
          </p>
        </div>

        {/* Order card */}
        <div className="mt-10 overflow-hidden rounded-sm border border-cream-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 bg-cream-100/60 px-6 py-4">
            <div>
              <p className="text-[0.6875rem] tracking-[0.16em] text-ink-400 uppercase">
                Order number
              </p>
              <p className="mt-1 font-display text-2xl tabular-nums">{orderNo(order.number)}</p>
            </div>
            <span className="rounded-xs border border-success/30 bg-success/10 px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.09em] text-success uppercase">
              Confirmed
            </span>
          </div>

          {/* Fulfilment */}
          <dl className="grid gap-5 border-b border-cream-200 px-6 py-5 sm:grid-cols-2">
            <div>
              <dt className="text-[0.6875rem] tracking-[0.16em] text-ink-400 uppercase">
                {order.type === "pickup" ? "Pickup from" : "Delivering to"}
              </dt>
              <dd className="mt-1.5 text-[0.9375rem] leading-relaxed">
                {order.type === "pickup" ? (
                  <>
                    {restaurant.name}
                    <br />
                    <span className="text-ink-500">{fullAddress(restaurant)}</span>
                  </>
                ) : (
                  deliveryAddress(order.customer)
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] tracking-[0.16em] text-ink-400 uppercase">
                Requested time
              </dt>
              <dd className="mt-1.5 text-[0.9375rem]">{when}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] tracking-[0.16em] text-ink-400 uppercase">
                Name
              </dt>
              <dd className="mt-1.5 text-[0.9375rem]">{order.customer.name}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] tracking-[0.16em] text-ink-400 uppercase">
                Phone
              </dt>
              <dd className="mt-1.5 text-[0.9375rem]">{order.customer.phone}</dd>
            </div>
          </dl>

          {/* Items */}
          <div className="px-6 py-5">
            <h2 className="text-[0.6875rem] tracking-[0.16em] text-ink-400 uppercase">
              Your order
            </h2>
            <ul className="mt-4 divide-y divide-cream-200">
              {order.items.map((i, idx) => (
                <li key={`${i.itemId}-${idx}`} className="py-3">
                  <p className="text-[0.9375rem]">
                    <span className="text-ink-500 tabular-nums">{i.quantity}×</span> {i.name}
                  </p>
                  {i.choices?.length ? (
                    <p className="mt-0.5 text-xs text-ink-700">{choiceText(i.choices)}</p>
                  ) : null}
                  {i.notes && <p className="mt-0.5 text-xs text-ink-500 italic">“{i.notes}”</p>}
                  <p className="mt-0.5 text-xs tabular-nums text-ink-500">
                    {currency(i.price * i.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {order.notes && (
              <p className="mt-4 rounded-sm bg-cream-100 px-4 py-3 text-sm text-ink-700">
                <span className="font-medium">Note for the kitchen:</span> {order.notes}
              </p>
            )}

            <dl className="mt-5 space-y-2 border-t border-cream-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="tabular-nums">{currency(order.subtotal)}</dd>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-500">Delivery</dt>
                  <dd className="tabular-nums">{currency(order.deliveryFee)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-500">Tax</dt>
                <dd className="tabular-nums">{currency(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-cream-300 pt-2.5 text-lg font-medium">
                <dt>Total paid</dt>
                <dd className="tabular-nums">{currency(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Restaurant contact */}
        <div className="mt-8 rounded-sm border border-cream-200 bg-cream-100/60 p-6">
          <h2 className="font-display text-lg">Questions about your order?</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Call us and quote order {orderNo(order.number)} and we will pull it up.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a href={telHref(restaurant)} className="btn btn-primary btn-sm">
              <IconPhone className="h-4 w-4" />
              {restaurant.phone}
            </a>
            <a
              href={mapsUrl(restaurant)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <IconPin className="h-4 w-4" />
              Directions
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/menu" className="text-[0.875rem] text-gold underline-offset-4 hover:underline">
            Order something else
          </Link>
        </div>
      </div>
    </div>
  );
}
