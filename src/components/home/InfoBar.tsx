import Link from "next/link";
import { mapsUrl, telHref } from "@/lib/restaurant";
import { getRestaurant, getSiteText } from "@/lib/db";
import { Txt } from "@/components/ui/Txt";
import { IconClock, IconLeaf, IconPhone, IconPin } from "@/components/ui/icons";

/**
 * Compact restaurant facts, immediately below the hero.
 * Answers "where", "when" and "how do I order" without competing with it.
 */
export async function InfoBar() {
  const [restaurant, t] = await Promise.all([getRestaurant(), getSiteText()]);
  const cells = [
    {
      icon: IconPin,
      label: "Find us",
      lines: [restaurant.address.street, `${restaurant.address.city}, ${restaurant.address.state} ${restaurant.address.zip}`],
      href: mapsUrl(restaurant),
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
      lines: [restaurant.phone, t["home.info.call_note"]],
      noteKey: "home.info.call_note" as const,
      href: telHref(restaurant),
    },
    {
      icon: IconLeaf,
      label: "Kitchen",
      lines: [restaurant.cuisine, t["home.info.kitchen_note"]],
      noteKey: "home.info.kitchen_note" as const,
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
                <p className="mt-1.5 text-[0.9375rem] leading-snug text-pretty font-medium text-ink">
                  {c.lines[0]}
                </p>
                <p className="mt-0.5 text-[0.8125rem] leading-snug text-pretty text-ink-500">
                  {c.noteKey ? <Txt k={c.noteKey} text={c.lines[1]} /> : c.lines[1]}
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
export async function WaysToOrder() {
  const t = await getSiteText();
  const ways = [
    {
      k: "home.ways.order" as const,
      title: t["home.ways.order.title"],
      copy: t["home.ways.order.copy"],
      href: "/menu",
      cta: "Start an order",
    },
    {
      k: "home.ways.reserve" as const,
      title: t["home.ways.reserve.title"],
      copy: t["home.ways.reserve.copy"],
      href: "/reservations",
      cta: "Reserve a table",
    },
    {
      k: "home.ways.catering" as const,
      title: t["home.ways.catering.title"],
      copy: t["home.ways.catering.copy"],
      href: "/catering",
      cta: "Make an enquiry",
    },
  ];

  return (
    <section className="section">
      <div className="container-page grid gap-px overflow-hidden rounded-sm border border-cream-200 bg-cream-200 md:grid-cols-3">
        {ways.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            className="group flex flex-col bg-cream p-7 transition-colors duration-300 hover:bg-cream-100 lg:p-9"
          >
            <h3 className="font-display text-2xl">
              <Txt k={`${w.k}.title`} text={w.title} />
            </h3>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-500">
              <Txt k={`${w.k}.copy`} text={w.copy} />
            </p>
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
