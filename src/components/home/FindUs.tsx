import Image from "next/image";
import Link from "next/link";
import { mapsUrl, mapsEmbedUrl, telHref } from "@/lib/restaurant";
import { getRestaurant, getSiteText } from "@/lib/db";
import { fillText } from "@/lib/site-text";
import { Txt } from "@/components/ui/Txt";
import { IconArrowRight } from "@/components/ui/icons";

export async function FindUs() {
  const [restaurant, t] = await Promise.all([getRestaurant(), getSiteText()]);
  return (
    <section className="section">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[5/4] overflow-hidden rounded-sm bg-cream-200 lg:aspect-[4/3]">
          <iframe
            src={mapsEmbedUrl(restaurant)}
            title={`Map to ${restaurant.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full grayscale-[15%]"
          />
        </div>

        <div>
          <p className="eyebrow eyebrow-rule"><Txt k="home.findus.eyebrow" text={t["home.findus.eyebrow"]} /></p>
          <h2 className="display-md mt-5 max-w-md text-balance">
            <Txt k="home.findus.title" text={t["home.findus.title"]} />
          </h2>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
            <Txt k="home.findus.body" text={t["home.findus.body"]} />
          </p>

          <dl className="mt-9 space-y-5 border-t border-cream-200 pt-8">
            <div>
              <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                Address
              </dt>
              <dd className="mt-1.5 text-[0.9375rem] text-ink">
                {restaurant.address.street}, {restaurant.address.city}, {restaurant.address.state}{" "}
                {restaurant.address.zip}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                Hours
              </dt>
              <dd className="mt-1.5 text-[0.9375rem] text-ink">
                {restaurant.hours.summary} · {restaurant.hours.buffet}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                Reservations & orders
              </dt>
              <dd className="mt-1.5 text-[0.9375rem] text-ink">
                <a href={telHref(restaurant)} className="underline-offset-4 hover:underline">
                  {restaurant.phone}
                </a>
              </dd>
            </div>
          </dl>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={mapsUrl(restaurant)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary group"
            >
              Get Directions
              <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Link href="/reservations" className="btn btn-secondary">
              Reserve a Table
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export async function ClosingCta() {
  const [restaurant, t] = await Promise.all([getRestaurant(), getSiteText()]);
  return (
    <section className="relative isolate overflow-hidden bg-clay">
      <Image
        src="/images/tandoori-closeup.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-clay-dark/55" aria-hidden />

      <div className="container-page relative z-10 flex flex-col items-center py-20 text-center md:py-28">
        <h2 className="display-lg max-w-2xl text-balance text-cream"><Txt k="home.closing.title" text={t["home.closing.title"]} /></h2>
        <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-pretty text-cream/75">
          <Txt k="home.closing.body" text={fillText(t["home.closing.body"], restaurant)} />
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/menu" className="btn btn-gold group">
            Order Online
            <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href="/catering" className="btn btn-ghost-light">
            Catering Enquiry
          </Link>
        </div>
      </div>
    </section>
  );
}
