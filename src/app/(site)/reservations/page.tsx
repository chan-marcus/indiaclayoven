import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { ReservationForm } from "@/components/forms/ReservationForm";
import { telHref } from "@/lib/restaurant";
import { getRestaurant, getSiteText } from "@/lib/db";
import { Lines } from "@/components/ui/Lines";

export const metadata: Metadata = {
  title: "Reservations",
  description:
    "Book a table at India Clay Oven on Clement Street, San Francisco. Dinner served seven nights a week.",
};

export default async function ReservationsPage() {
  const [restaurant, t] = await Promise.all([getRestaurant(), getSiteText()]);
  // "{phone}" in the text becomes a tap-to-call link.
  const [beforePhone, ...rest] = t["reservations.large_parties"].split("{phone}");
  const afterPhone = rest.join(restaurant.phone);
  return (
    <>
      <PageHeader
        eyebrow={t["reservations.header.eyebrow"]}
        title={t["reservations.header.title"]}
        intro={t["reservations.header.intro"]}
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="display-md text-balance">{t["reservations.body.title"]}</h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
              <Lines text={t["reservations.body.text"]} />
            </p>

            <dl className="mt-10 space-y-6 border-t border-cream-200 pt-8 text-[0.9375rem]">
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Dinner service
                </dt>
                <dd className="mt-1.5 leading-relaxed">
                  {t["reservations.dinner_note"]}
                  <br />
                  <span className="text-ink-500">{restaurant.hours.summary}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Lunch buffet
                </dt>
                <dd className="mt-1.5 leading-relaxed">
                  {restaurant.hours.buffet}
                  <br />
                  <span className="text-ink-500">{t["reservations.buffet_note"]}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Large parties
                </dt>
                <dd className="mt-1.5 leading-relaxed">
                  {beforePhone}
                  {rest.length > 0 && (
                    <a href={telHref(restaurant)} className="text-gold underline-offset-4 hover:underline">
                      {restaurant.phone}
                    </a>
                  )}
                  {afterPhone}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <ReservationForm />
          </div>
        </div>
      </section>
    </>
  );
}
