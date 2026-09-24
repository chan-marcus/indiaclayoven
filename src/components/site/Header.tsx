"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart-context";
import { IconBag, IconClose, IconMenu, IconPhone } from "@/components/ui/icons";
import { telHref } from "@/lib/restaurant";
import { useRestaurantData } from "@/lib/restaurant-data";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/catering", label: "Catering & Parties" },
  { href: "/reservations", label: "Reservations" },
  { href: "/menu", label: "Menu" },
];

export function Header() {
  const { settings: restaurant } = useRestaurantData();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, openCart, pulse } = useCart();
  const [bump, setBump] = useState(false);
  const firstPulse = useRef(true);

  // Header gains a hairline + solid background once the hero scrolls away.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer on every navigation.
  // (The Framer prototype left it open. This is the fix.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  // Lock scroll behind the mobile drawer.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Nudge the cart icon when something is added.
  useEffect(() => {
    if (firstPulse.current) {
      firstPulse.current = false;
      return;
    }
    setBump(true);
    const t = setTimeout(() => setBump(false), 420);
    return () => clearTimeout(t);
  }, [pulse]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "border-b border-cream-200 bg-cream/92 backdrop-blur-md"
            : "border-b border-transparent bg-cream"
        }`}
      >
        <div className="container-page flex h-[4.5rem] items-center justify-between gap-6 md:h-20">
          <Logo />

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`relative py-1 text-[0.8125rem] font-medium tracking-wide transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-gold after:transition-all after:duration-300 ${
                  isActive(n.href)
                    ? "text-ink after:w-full"
                    : "text-ink-500 after:w-0 hover:text-ink hover:after:w-full"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={telHref(restaurant)}
              className="hidden items-center gap-1.5 text-[0.8125rem] text-ink-500 transition-colors hover:text-ink xl:inline-flex"
            >
              <IconPhone className="h-4 w-4" />
              {restaurant.phone}
            </a>

            <Link href="/menu" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Order Online
            </Link>

            <button
              type="button"
              onClick={openCart}
              aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xs text-ink transition-[background-color,transform] duration-200 hover:bg-cream-100 ${
                bump ? "scale-110" : "scale-100"
              }`}
            >
              <IconBag className="h-[1.35rem] w-[1.35rem]" />
              {count > 0 && (
                <span className="absolute top-1.5 right-1 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-clay px-1 text-[0.625rem] font-semibold text-cream tabular-nums">
                  {count}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="flex h-11 w-11 items-center justify-center rounded-xs text-ink transition-colors hover:bg-cream-100 lg:hidden"
            >
              <IconMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 animate-fade-in bg-ink/45"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] animate-slide-in-right flex-col bg-cream shadow-2xl">
            <div className="flex h-[4.5rem] items-center justify-between border-b border-cream-200 px-5">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-xs text-ink transition-colors hover:bg-cream-100"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col px-5 py-3" aria-label="Mobile">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  // Explicit close as well as the pathname effect, so tapping the
                  // link you are already on also dismisses the drawer.
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={`flex min-h-[3.25rem] items-center border-b border-cream-200 font-display text-[1.35rem] transition-colors ${
                    isActive(n.href) ? "text-gold" : "text-ink hover:text-gold"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-3 border-t border-cream-200 p-5">
              <Link
                href="/menu"
                onClick={() => setMobileOpen(false)}
                className="btn btn-primary btn-block"
              >
                Order Online
              </Link>
              <a href={telHref(restaurant)} className="btn btn-secondary btn-block">
                <IconPhone className="h-4 w-4" />
                {restaurant.phone}
              </a>
              <p className="pt-1 text-center text-xs leading-relaxed text-ink-500">
                {restaurant.address.street}
                <br />
                {restaurant.hours.summary}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
