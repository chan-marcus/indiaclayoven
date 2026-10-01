"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Choice, MenuItem } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { currency } from "@/lib/format";
import { Badge, SoldOutTag } from "@/components/ui/Badge";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { IconClose } from "@/components/ui/icons";
import { useRestaurantData } from "@/lib/restaurant-data";

export function ItemDetailModal({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const { addItem, openCart } = useCart();
  const { categories, optionGroups } = useRestaurantData();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  /** Option group id → the option picked. */
  const [picked, setPicked] = useState<Record<string, string>>({});

  // Reset the form each time a different dish is opened.
  useEffect(() => {
    // Deliberately resets the form when a different dish is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuantity(1);
    setNotes("");
    setPicked({});
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const groups = optionGroups.filter((g) => item.optionGroupIds.includes(g.id));
  const missing = groups.find((g) => !g.options.includes(picked[g.id]));
  const choices: Choice[] = groups.map((g) => ({ groupId: g.id, group: g.name, choice: picked[g.id] }));

  const add = () => {
    if (missing) return;
    addItem(item, quantity, notes, choices);
    onClose();
    openCart();
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-ink/50"
      />

      <div className="relative flex max-h-[92vh] w-full animate-slide-up flex-col overflow-hidden rounded-t-md bg-cream sm:max-w-4xl sm:animate-rise sm:flex-row sm:rounded-sm">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream/85 text-ink backdrop-blur transition-colors hover:bg-cream"
        >
          <IconClose className="h-5 w-5" />
        </button>

        {/* Photograph */}
        <div className="relative h-52 w-full shrink-0 bg-cream-200 sm:h-auto sm:w-[45%]">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 45vw"
            className="object-cover"
          />
        </div>

        {/* Detail */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 sm:p-8">
          <p className="text-[0.6875rem] tracking-[0.16em] text-gold uppercase">
            {categories.find((c) => c.id === item.categoryId)?.name}
          </p>

          <h2 className="mt-2 font-display text-3xl leading-tight">{item.name}</h2>

          {(item.badges.length > 0 || !item.available) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.badges.map((b) => (
                <Badge key={b} kind={b} />
              ))}
              {!item.available && <SoldOutTag />}
            </div>
          )}

          {item.description && (
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-500">{item.description}</p>
          )}

          <p className="mt-5 font-display text-2xl tabular-nums">{currency(item.price)}</p>

          {item.available ? (
            <>
              {groups.map((g) => (
                <fieldset key={g.id} className="mt-7">
                  <legend className="field-label">{g.name}</legend>
                  <div className="flex flex-wrap gap-2">
                    {g.options.map((o) => {
                      const on = picked[g.id] === o;
                      return (
                        <label
                          key={o}
                          className={`cursor-pointer rounded-xs border px-3.5 py-2 text-[0.875rem] whitespace-nowrap transition-colors has-focus-visible:ring-2 has-focus-visible:ring-gold ${
                            on
                              ? "border-clay bg-clay text-cream"
                              : "border-cream-300 bg-white text-ink-700 hover:border-earth"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`opt-${g.id}`}
                            value={o}
                            checked={on}
                            onChange={() => setPicked((p) => ({ ...p, [g.id]: o }))}
                            className="sr-only"
                          />
                          {o}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

              <div className="mt-7">
                <label htmlFor="item-notes" className="field-label">
                  Special requests <span className="normal-case">(optional)</span>
                </label>
                <textarea
                  id="item-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder={groups.length ? "No nuts, extra sauce…" : "Mild, extra spicy, no dairy…"}
                  className="field-input"
                />
                <p className="mt-1.5 text-xs text-ink-400">
                  We can prepare most dishes gluten free, vegan or dairy free.
                </p>
              </div>

              <div className="mt-auto flex items-center gap-3 pt-7">
                <QuantityStepper value={quantity} onChange={setQuantity} />
                <button
                  type="button"
                  onClick={add}
                  disabled={Boolean(missing)}
                  className="btn btn-primary min-w-0 flex-1"
                >
                  <span className="truncate">
                    {missing
                      ? `Choose ${missing.name.toLowerCase()}`
                      : `Add to Order · ${currency(item.price * quantity)}`}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="mt-auto pt-7">
              <div className="rounded-sm border border-cream-300 bg-cream-100 p-4">
                <p className="text-[0.9375rem] font-medium">Sold out for today</p>
                <p className="mt-1 text-sm text-ink-500">
                  This dish is off the menu right now. Everything else is available. Check back
                  tomorrow.
                </p>
              </div>
              <button type="button" onClick={onClose} className="btn btn-secondary btn-block mt-3">
                Back to the menu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
