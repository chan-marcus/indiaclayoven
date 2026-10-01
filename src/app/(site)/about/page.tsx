import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { fullAddress, mapsUrl, telHref } from "@/lib/restaurant";
import { getRestaurant, getSiteText } from "@/lib/db";
import { Txt } from "@/components/ui/Txt";
import { IconArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "A neighbourhood clay oven on Clement Street. The story behind India Clay Oven: charcoal tandoor cooking, house-ground spices and the Richmond District.",
};

export default async function AboutPage() {
  const [restaurant, t] = await Promise.all([getRestaurant(), getSiteText()]);
  return (
    <>
      <PageHeader
        k="about.header"
        eyebrow={t["about.header.eyebrow"]}
        title={t["about.header.title"]}
        image="/images/restaurant-interior.jpg"
        alt="The dining room at India Clay Oven"
      />

      {/* Story */}
      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="eyebrow eyebrow-rule"><Txt k="about.story.eyebrow" text={t["about.story.eyebrow"]} /></p>
            <h2 className="display-md mt-5 text-balance">
              <Txt k="about.story.title" text={t["about.story.title"]} />
            </h2>
          </div>

          <div className="space-y-6 text-[1.0625rem] leading-relaxed text-pretty text-ink-700">
            <p>
              <Txt k="about.story.p1" text={t["about.story.p1"]} />
            </p>
            <p>
              <Txt k="about.story.p2" text={t["about.story.p2"]} />
            </p>
            <p className="text-ink-500">
              <Txt k="about.story.p3" text={t["about.story.p3"]} />
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
              <p className="eyebrow pt-1.5"><Txt k="about.oven.eyebrow" text={t["about.oven.eyebrow"]} /></p>
              <div>
                <h3 className="display-md text-balance">
                  <Txt k="about.oven.title" text={t["about.oven.title"]} />
                </h3>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
                  <Txt k="about.oven.body" text={t["about.oven.body"]} />
                </p>
              </div>
            </article>

            <article className="grid gap-6 md:grid-cols-[10rem_1fr] md:gap-12">
              <p className="eyebrow pt-1.5"><Txt k="about.kitchen.eyebrow" text={t["about.kitchen.eyebrow"]} /></p>
              <div>
                <h3 className="display-md text-balance"><Txt k="about.kitchen.title" text={t["about.kitchen.title"]} /></h3>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
                  <Txt k="about.kitchen.body" text={t["about.kitchen.body"]} />
                </p>
              </div>
            </article>

            <article className="grid gap-6 md:grid-cols-[10rem_1fr] md:gap-12">
              <p className="eyebrow pt-1.5"><Txt k="about.room.eyebrow" text={t["about.room.eyebrow"]} /></p>
              <div>
                <h3 className="display-md text-balance">
                  <Txt k="about.room.title" text={t["about.room.title"]} />
                </h3>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
                  <Txt k="about.room.body" text={t["about.room.body"]} />
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
            <p className="eyebrow eyebrow-rule"><Txt k="about.visit.eyebrow" text={t["about.visit.eyebrow"]} /></p>
            <h2 className="display-md mt-5"><Txt k="about.visit.title" text={t["about.visit.title"]} /></h2>

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
                  <Txt k="about.visit.hours_note" text={t["about.visit.hours_note"]} />
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Reservations & orders
                </dt>
                <dd className="mt-1.5 text-[0.9375rem]">
                  <a href={telHref(restaurant)} className="underline-offset-4 hover:underline">
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
                href={mapsUrl(restaurant)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Directions to {fullAddress(restaurant).split(",")[0]}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
