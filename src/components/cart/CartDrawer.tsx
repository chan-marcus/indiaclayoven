"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { currency } from "@/lib/format";
import { QuantityStepper } from "./QuantityStepper";
import { IconBag, IconClose, IconTrash } from "@/components/ui/icons";

export function CartDrawer() {
  const { isOpen, closeCart, lines, subtotal, tax, total, count, setQuantity, removeLine } =
    useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70" role="dialog" aria-modal="true" aria-label="Your order">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 animate-fade-in bg-ink/45"
      />

      {/* Bottom sheet on mobile, right drawer from sm up */}
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] animate-slide-up flex-col rounded-t-md bg-cream sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[26rem] sm:animate-slide-in-right sm:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <IconBag className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl">Your Order</h2>
            {count > 0 && (
              <span className="text-sm text-ink-500 tabular-nums">
                ({count} {count === 1 ? "item" : "items"})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center rounded-xs text-ink transition-colors hover:bg-cream-100"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cream-300 text-ink-400">
              <IconBag className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg">Your order is empty</p>
              <p className="mt-1 text-sm text-ink-500">
                Add something from the clay oven and it will show up here.
              </p>
            </div>
            <Link href="/menu" onClick={closeCart} className="btn btn-primary btn-sm mt-1">
              Browse the menu
            </Link>
          </div>
        ) : (
          <>
            {/* Lines */}
            <ul className="flex-1 divide-y divide-cream-200 overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.lineId} className="flex gap-3.5 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-cream-100">
                    <Image
                      src={line.image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] leading-snug font-medium">{line.name}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-ink-500">
                      {currency(line.price * line.quantity)}
                    </p>

                    {line.notes && (
                      <p className="mt-1 text-xs leading-relaxed text-ink-500 italic">
                        “{line.notes}”
                      </p>
                    )}

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <QuantityStepper
                        size="sm"
                        value={line.quantity}
                        min={1}
                        onChange={(q) => setQuantity(line.lineId, q)}
                        ariaLabel={`Quantity for ${line.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(line.lineId)}
                        aria-label={`Remove ${line.name}`}
                        className="flex items-center gap-1.5 rounded-xs px-2 py-1.5 text-xs text-ink-500 transition-colors hover:bg-cream-100 hover:text-danger"
                      >
                        <IconTrash className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t border-cream-200 bg-cream-100/60 px-5 py-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Subtotal</dt>
                  <dd className="tabular-nums">{currency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Estimated tax</dt>
                  <dd className="tabular-nums">{currency(tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-cream-300 pt-2.5 text-base font-medium">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{currency(total())}</dd>
                </div>
              </dl>

              <Link href="/checkout" onClick={closeCart} className="btn btn-primary btn-block mt-4">
                Checkout
              </Link>
              <p className="mt-2.5 text-center text-xs text-ink-400">
                Delivery fee, if any, is added at checkout.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
