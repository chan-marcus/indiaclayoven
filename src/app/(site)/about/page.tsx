import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { restaurant, fullAddress, mapsUrl, telHref } from "@/lib/data/restaurant";
import { IconArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "A neighbourhood clay oven on Clement Street. The story behind India Clay Oven: charcoal tandoor cooking, house-ground spices and the Richmond District.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="A neighbourhood clay oven on Clement Street"
        image="/images/restaurant-interior.jpg"
        alt="The dining room at India Clay Oven"
      />

      {/* Story */}
      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="eyebrow eyebrow-rule">Our story</p>
            <h2 className="display-md mt-5 text-balance">
              Traditional North Indian, cooked the long way
            </h2>
          </div>

          <div className="space-y-6 text-[1.0625rem] leading-relaxed text-pretty text-ink-700">
            <p>
              India Clay Oven has served the Richmond District from a small storefront on Clement
              Street for many years. The cooking is traditional North Indian: a charcoal-fired
              tandoor for breads and kababs, heavy pots for the curries, and spices ground in the
              kitchen rather than bought by the case.
            </p>
            <p>
              At lunch the room fills for the daily buffet, a rotating spread of vegetarian
              dishes, chicken, rice, raita and fresh nan. In the evening the full dinner menu comes
              out, along with the bar. Regulars bring their families; first-timers usually come
              back.
            </p>
            <p className="text-ink-500">
              Ask and we will make any dish gluten free, vegan or dairy free.
            </p>
          </div>
        </div>
      </section>

      {/* Full-bleed photograph */}
      <section className="relative h-[22rem] md:h-[32rem]">
        <Image
          src="/images/tandoor-fire.jpg"
          alt="Bread baking against the wall of the charcoal tandoor"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </section>

      {/* Philosophy: editorial pairs, not cards */}
      <section className="section">
        <div className="container-page max-w-4xl">
          <div className="grid gap-14 md:gap-20">
            <article className="grid gap-6 md:grid-cols-[10rem_1fr] md:gap-12">
              <p className="eyebrow pt-1.5">The oven</p>
              <div>
                <h3 className="display-md text-balance">
                  The tandoor runs on charcoal from open to close
                </h3>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
                  Breads are slapped against the clay wall and baked to order. Kababs come out on
                  sizzling platters. Nothing here is finished in a microwave, which is why the nan
                  arrives when it arrives.
                </p>
              </div>
            </article>

            <article className="grid gap-6 md:grid-cols-[10rem_1fr] md:gap-12">
              <p className="eyebrow pt-1.5">The kitchen</p>
              <div>
                <h3 className="display-md text-balance">Curries are built the slow way</h3>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
                  Onions browned properly, whole spices bloomed in hot oil, then left to simmer.
                  A vindaloo should sting a little; a korma should not. We cook to the dish rather
                  than to a house spice level, and we will happily adjust either way.
                </p>
              </div>
            </article>

            <article className="grid gap-6 md:grid-cols-[10rem_1fr] md:gap-12">
              <p className="eyebrow pt-1.5">The room</p>
              <div>
                <h3 className="display-md text-balance">
                  A short walk from Golden Gate Park
                </h3>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
                  We are on Clement between 25th and 26th Avenue, in the middle of one of the best
                  eating streets in San Francisco. Street parking is easiest before six. The full
                  bar is open through dinner.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Visit */}
      <section className="section bg-cream-100/70">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-cream-200">
            <Image
              src="/images/dining-service.jpg"
              alt="A table being served in the dining room"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="eyebrow eyebrow-rule">Visit us</p>
            <h2 className="display-md mt-5">Come by for the buffet, stay for dinner</h2>

            <dl className="mt-9 space-y-6 border-t border-cream-300 pt-8">
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Address
                </dt>
                <dd className="mt-1.5 text-[0.9375rem] leading-relaxed">
                  {restaurant.address.street} ({restaurant.address.line2})
                  <br />
                  {restaurant.address.city}, {restaurant.address.state} {restaurant.address.zip}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Hours
                </dt>
                <dd className="mt-1.5 text-[0.9375rem] leading-relaxed">
                  {restaurant.hours.summary}
                  <br />
                  {restaurant.hours.buffet}
                  <br />
                  Full dinner menu 7 days a week
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Reservations & orders
                </dt>
                <dd className="mt-1.5 text-[0.9375rem]">
                  <a href={telHref} className="underline-offset-4 hover:underline">
                    {restaurant.phone}
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/menu" className="btn btn-primary group">
                View the Menu
                <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Directions to {fullAddress.split(",")[0]}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
