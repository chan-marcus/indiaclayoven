import Link from "next/link";
import { Logo } from "./Logo";
import { restaurant, mapsUrl, telHref } from "@/lib/data/restaurant";
import { IconArrowRight } from "@/components/ui/icons";

export function Footer() {
  return (
    <footer className="mt-auto bg-clay-dark text-cream">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 md:py-20 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        {/* Identity */}
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-xs font-display text-xl leading-snug text-cream/80 italic">
            Experience the taste of India.
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/55">
            {restaurant.cuisine}. Charcoal-fired, on Clement Street.
          </p>
        </div>

        {/* Visit */}
        <div>
          <h3 className="text-[0.6875rem] font-medium tracking-[0.18em] text-gold-bright uppercase">
            Visit
          </h3>
          <address className="mt-5 space-y-1 text-sm leading-relaxed text-cream/75 not-italic">
            <p>{restaurant.address.street}</p>
            <p>
              {restaurant.address.city}, {restaurant.address.state} {restaurant.address.zip}
            </p>
            <p className="text-cream/50">{restaurant.address.line2}</p>
          </address>
          <a
            href={telHref}
            className="mt-3 inline-block text-sm text-cream/75 underline-offset-4 transition-colors hover:text-gold-bright hover:underline"
          >
            {restaurant.phone}
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 flex w-fit items-center gap-2 text-[0.8125rem] font-medium text-gold-bright transition-colors hover:text-cream"
          >
            Get directions
            <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        {/* Hours */}
        <div>
          <h3 className="text-[0.6875rem] font-medium tracking-[0.18em] text-gold-bright uppercase">
            Hours
          </h3>
          <ul className="mt-5 space-y-2.5 text-sm text-cream/75">
            {restaurant.hours.detail.map((h) => (
              <li key={h.days} className="flex flex-col">
                <span className="text-cream/55">{h.days}</span>
                <span>{h.time}</span>
              </li>
            ))}
            <li className="border-t border-cream/15 pt-3 text-gold-bright">
              {restaurant.hours.buffet}
            </li>
          </ul>
        </div>

        {/* Explore */}
        <div>
          <h3 className="text-[0.6875rem] font-medium tracking-[0.18em] text-gold-bright uppercase">
            Explore
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { href: "/menu", label: "Order Online" },
              { href: "/reservations", label: "Reservations" },
              { href: "/catering", label: "Catering & Parties" },
              { href: "/about", label: "About Us" },
              { href: "/menu", label: "Full Menu" },
            ].map((l, i) => (
              <li key={`${l.href}-${i}`}>
                <Link
                  href={l.href}
                  className="text-cream/75 underline-offset-4 transition-colors hover:text-gold-bright hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Map strip: address stays visible near the footer */}
      <div className="border-t border-cream/12">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group container-page flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-sm text-cream/70">
            We are on Clement between 25th and 26th Avenue, a short walk from Golden Gate Park.
          </span>
          <span className="inline-flex items-center gap-2 text-[0.8125rem] font-medium whitespace-nowrap text-gold-bright">
            Open in Google Maps
            <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </a>
      </div>

      <div className="border-t border-cream/12">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {restaurant.name} {restaurant.tagline}
          </p>
          <p>
            {restaurant.address.street}, {restaurant.address.line2}
          </p>
        </div>
      </div>
    </footer>
  );
}
