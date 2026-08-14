"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OvenMark } from "@/components/site/OvenMark";
import { restaurant } from "@/lib/data/restaurant";
import { IconGrid, IconReceipt, IconSettings, IconArrowRight } from "@/components/ui/icons";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: IconGrid },
  { href: "/dashboard/orders", label: "Orders", icon: IconReceipt },
  { href: "/dashboard/menu", label: "Menu", icon: IconGrid },
  { href: "/dashboard/settings", label: "Settings", icon: IconSettings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <OvenMark className="h-7 w-7 text-clay" ground={false} />
          <div className="leading-tight">
            <p className="text-[0.9375rem] font-medium">{restaurant.name}</p>
            <p className="text-[0.6875rem] tracking-wide text-ink-400">Owner dashboard</p>
          </div>
        </div>

        <Link
          href="/"
          className="group hidden items-center gap-2 text-[0.8125rem] text-ink-500 transition-colors hover:text-ink sm:inline-flex"
        >
          View your website
          <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <nav className="container-page flex gap-1 overflow-x-auto" aria-label="Dashboard">
        {NAV.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-3.5 py-3 text-[0.875rem] font-medium whitespace-nowrap transition-colors ${
                active
                  ? "border-clay text-ink"
                  : "border-transparent text-ink-500 hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
