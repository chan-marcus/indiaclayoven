import Link from "next/link";
import { restaurant, mapsUrl, telHref } from "@/lib/data/restaurant";
import { IconClock, IconLeaf, IconPhone, IconPin } from "@/components/ui/icons";

/**
 * Compact restaurant facts, immediately below the hero.
 * Answers "where", "when" and "how do I order" without competing with it.
 */
export function InfoBar() {
  const cells = [
    {
      icon: IconPin,
      label: "Find us",
      lines: [restaurant.address.street, `${restaurant.address.city}, ${restaurant.address.state} ${restaurant.address.zip}`],
      href: mapsUrl,
      external: true,
    },
    {
      icon: IconClock,
      label: "Hours",
      lines: [restaurant.hours.summary, restaurant.hours.buffet],
    },
    {
      icon: IconPhone,
      label: "Call us",
      lines: [restaurant.phone, "Reservations & takeout"],
      href: telHref,
    },
    {
      icon: IconLeaf,
      label: "Kitchen",
      lines: [restaurant.cuisine, "Gluten free, vegan & dairy free on request"],
    },
  ];

  return (
    <section className="border-b border-cream-200 bg-cream-100" aria-label="Restaurant information">
      <div className="container-page grid grid-cols-1 divide-y divide-cream-300/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {cells.map((c) => {
          const Icon = c.icon;
          const body = (
            <div className="flex gap-3.5 px-0 py-5 lg:px-6">
              <Icon className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 text-gold" />
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  {c.label}
                </p>
                <p className="mt-1.5 text-[0.9375rem] leading-snug font-medium text-ink">
                  {c.lines[0]}
                </p>
                <p className="mt-0.5 text-[0.8125rem] leading-snug text-pretty text-ink-500">
                  {c.lines[1]}
                </p>
              </div>
            </div>
          );

          if (!c.href) {
            return (
              <div key={c.label} className="lg:first:pl-0 lg:last:pr-0">
                {body}
              </div>
            );
          }

          return c.external ? (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-colors hover:bg-cream-200/45"
            >
              {body}
            </a>
          ) : (
            <a key={c.label} href={c.href} className="group transition-colors hover:bg-cream-200/45">
              {body}
            </a>
          );
        })}
      </div>
    </section>
  );
}

/** Slim strip of the three ways to eat with us. */
export function WaysToOrder() {
  const ways = [
    {
      title: "Order Online",
      copy: "Pickup or delivery from the full dinner menu, seven days a week.",
      href: "/menu",
      cta: "Start an order",
    },
    {
      title: "Reservations",
      copy: "Book a table for dinner, or call and we will take care of the rest.",
      href: "/reservations",
      cta: "Reserve a table",
    },
    {
      title: "Parties & Catering",
      copy: "Birthdays, engagements, rehearsals and corporate events. Here or at your venue.",
      href: "/catering",
      cta: "Make an enquiry",
    },
  ];

  return (
    <section className="section">
      <div className="container-page grid gap-px overflow-hidden rounded-sm border border-cream-200 bg-cream-200 md:grid-cols-3">
        {ways.map((w) => (
          <Link
            key={w.title}
            href={w.href}
            className="group flex flex-col bg-cream p-7 transition-colors duration-300 hover:bg-cream-100 lg:p-9"
          >
            <h3 className="font-display text-2xl">{w.title}</h3>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-500">{w.copy}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-[0.8125rem] font-medium text-gold">
              {w.cta}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
