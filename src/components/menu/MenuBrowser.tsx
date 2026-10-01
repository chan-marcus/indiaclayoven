"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MenuItem } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useRestaurantData } from "@/lib/restaurant-data";
import { currency } from "@/lib/format";
import { fromPrice, hasPricedChoices } from "@/lib/pricing";
import { Badge, SoldOutTag } from "@/components/ui/Badge";
import { ItemDetailModal } from "./ItemDetailModal";
import { IconLeaf, IconPlus, IconSearch, IconClose, IconBag } from "@/components/ui/icons";
import { Txt } from "@/components/ui/Txt";

export function MenuBrowser() {
  const params = useSearchParams();
  const { addItem, count, openCart, subtotal } = useCart();
  const { items: menuItems, categories } = useRestaurantData();

  // Live selectors over the shared store, so anything the owner changes in the
  // dashboard (price, availability, new dishes) is reflected here.
  const itemsByCategory = useCallback(
    (categoryId: string) =>
      menuItems.filter((i) => i.categoryId === categoryId).sort((a, b) => a.sort - b.sort),
    [menuItems],
  );
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);

  // A dish with choices (spice level etc.) opens so the customer can pick.
  const quickAdd = (item: MenuItem) =>
    item.optionGroupIds.length ? setOpenItem(item) : addItem(item, 1);
  const [query, setQuery] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // While a click-to-jump is animating, ignore the observer so the highlight
  // doesn't flicker through every category on the way.
  const jumping = useRef(false);

  /* Deep link from the homepage: /menu?item=<id> opens that dish. */
  useEffect(() => {
    const id = params.get("item");
    if (!id) return;
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;
    // Opens the dish named by the ?item= deep link once the URL is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenItem(item);
    const section = sectionRefs.current[item.categoryId];
    if (section) {
      requestAnimationFrame(() =>
        section.scrollIntoView({ block: "start", behavior: "auto" }),
      );
    }
  }, [params, menuItems]);

  /* Scroll spy */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (jumping.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveCategory(visible[0].target.id);
      },
      // Band just below the sticky header. Whichever section crosses it wins.
      { rootMargin: "-30% 0px -62% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // Re-observe when the owner adds or removes a category.
  }, [categories]);

  /* Keep the active chip in view on mobile */
  useEffect(() => {
    chipRefs.current[activeCategory]?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeCategory]);

  const jumpTo = (id: string) => {
    jumping.current = true;
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      jumping.current = false;
    }, 700);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return menuItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q),
    );
  }, [query, menuItems]);

  return (
    <>
      {/* Mobile category rail */}
      <div className="sticky top-[4.5rem] z-30 border-b border-cream-200 bg-cream/95 backdrop-blur-md lg:hidden">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3">
          {categories.map((c) => (
            <button
              key={c.id}
              ref={(el) => {
                chipRefs.current[c.id] = el;
              }}
              type="button"
              onClick={() => jumpTo(c.id)}
              className={`shrink-0 rounded-xs border px-3.5 py-2 text-[0.8125rem] whitespace-nowrap transition-colors duration-200 ${
                activeCategory === c.id
                  ? "border-clay bg-clay text-cream"
                  : "border-cream-300 text-ink-700 hover:border-earth"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Extra bottom padding on mobile clears the fixed cart bar */}
      <div className={`container-page py-10 lg:py-14 ${count > 0 ? "pb-28 lg:pb-14" : ""}`}>
        <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-14">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                Categories
              </p>
              <nav className="mt-4 flex flex-col" aria-label="Menu categories">
                {categories.map((c) => {
                  const active = activeCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => jumpTo(c.id)}
                      aria-current={active ? "true" : undefined}
                      className={`group relative border-l py-2.5 pl-4 text-left text-[0.9375rem] transition-colors duration-200 ${
                        active
                          ? "border-gold font-medium text-ink"
                          : "border-cream-200 text-ink-500 hover:border-earth hover:text-ink"
                      }`}
                    >
                      {c.name}
                      <span className="ml-2 text-xs text-ink-400 tabular-nums">
                        {itemsByCategory(c.id).length}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Desktop cart summary, always reachable while browsing */}
              {count > 0 && (
                <button
                  type="button"
                  onClick={openCart}
                  className="mt-8 flex w-full items-center justify-between rounded-sm border border-cream-300 bg-white p-4 text-left transition-colors hover:border-earth"
                >
                  <span>
                    <span className="flex items-center gap-2 text-[0.9375rem] font-medium">
                      <IconBag className="h-4 w-4 text-gold" />
                      {count} {count === 1 ? "item" : "items"}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">
                      {currency(subtotal)} subtotal
                    </span>
                  </span>
                  <span className="text-[0.8125rem] font-medium text-gold">View →</span>
                </button>
              )}
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0">
            {/* Search */}
            <div className="relative mb-8">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the menu: biryani, paneer, vindaloo…"
                aria-label="Search the menu"
                className="field-input pl-11"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xs text-ink-500 hover:bg-cream-100"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              )}
            </div>

            {results ? (
              <section>
                <h2 className="font-display text-2xl">
                  {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
                </h2>
                <div className="mt-6 divide-y divide-cream-200 border-y border-cream-200">
                  {results.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onOpen={() => setOpenItem(item)}
                      onAdd={() => quickAdd(item)}
                    />
                  ))}
                </div>
                {results.length === 0 && (
                  <p className="mt-6 text-ink-500">
                    Nothing matched that. Try “tandoori”, “nan” or “lamb”.
                  </p>
                )}
              </section>
            ) : (
              categories.map((category) => {
                const items = itemsByCategory(category.id);
                if (items.length === 0) return null;
                return (
                  <section
                    key={category.id}
                    id={category.id}
                    ref={(el) => {
                      sectionRefs.current[category.id] = el;
                    }}
                    className="scroll-mt-40 pb-14 lg:scroll-mt-28"
                  >
                    <div className="border-b border-cream-300 pb-4">
                      <h2 className="display-md">{category.name}</h2>
                      {category.note && (
                        <p className="mt-2 max-w-2xl text-[0.9375rem] text-ink-500 italic">
                          {category.note}
                        </p>
                      )}
                    </div>

                    <div className="divide-y divide-cream-200">
                      {items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          onOpen={() => setOpenItem(item)}
                          onAdd={() => quickAdd(item)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ItemDetailModal item={openItem} onClose={() => setOpenItem(null)} />

      {/* Mobile sticky cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300 bg-cream/97 p-3 backdrop-blur-md lg:hidden">
          <button type="button" onClick={openCart} className="btn btn-primary btn-block">
            <IconBag className="h-4 w-4" />
            View order · {count} {count === 1 ? "item" : "items"} · {currency(subtotal)}
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function ItemRow({
  item,
  onOpen,
  onAdd,
}: {
  item: MenuItem;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const sold = !item.available;
  const { optionGroups } = useRestaurantData();

  return (
    <div
      className={`group relative flex gap-4 py-5 transition-colors duration-200 ${
        sold ? "" : "hover:bg-cream-100/60"
      }`}
    >
      {/* Whole row is the click target for the detail modal */}
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-0"
        aria-label={`View ${item.name}`}
      />

      {/* Dishes without a photo show as text only */}
      {item.image && (
        <div
          className={`relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-sm bg-cream-200 sm:h-24 sm:w-24 ${
            sold ? "opacity-45 grayscale" : ""
          }`}
        >
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="96px"
            className={sold ? "object-cover" : "img-zoom object-cover"}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h3
            className={`font-display text-[1.0625rem] leading-snug sm:text-[1.1875rem] ${
              sold ? "text-ink-500" : ""
            }`}
          >
            {item.name}
          </h3>
          {item.badges.slice(0, 2).map((b) => (
            <Badge key={b} kind={b} />
          ))}
          {sold && <SoldOutTag />}
        </div>

        {item.description && (
          <p className="mt-1.5 line-clamp-2 max-w-xl text-[0.875rem] leading-relaxed text-ink-500 sm:line-clamp-none">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-4 pt-3">
          <span
            className={`text-[0.9375rem] font-medium tabular-nums ${
              sold ? "text-ink-400" : ""
            }`}
          >
            {hasPricedChoices(item, optionGroups) && "From "}
            {currency(fromPrice(item, optionGroups))}
          </span>
        </div>
      </div>

      {/* Add button sits above the row-wide click target */}
      <div className="relative z-1 flex items-center">
        {sold ? (
          <span className="rounded-xs border border-cream-300 px-3 py-2 text-[0.8125rem] text-ink-400">
            Unavailable
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            aria-label={`Add ${item.name} to your order`}
            className="btn btn-secondary btn-sm gap-1.5 group-hover:border-ink"
          >
            <IconPlus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

export function DietaryNote() {
  const { text: t } = useRestaurantData();
  return (
    <div className="border-b border-cream-200 bg-gold-soft/35">
      <div className="container-page flex items-start gap-3 py-3.5">
        <IconLeaf className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 text-gold" />
        <p className="text-[0.875rem] leading-relaxed text-ink-700">
          <span className="font-medium"><Txt k="menu.dietary.label" text={t["menu.dietary.label"]} /></span> <Txt k="menu.dietary.body" text={t["menu.dietary.body"]} />
        </p>
      </div>
    </div>
  );
}
