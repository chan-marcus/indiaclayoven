import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { ReservationForm } from "@/components/forms/ReservationForm";
import { restaurant, telHref } from "@/lib/data/restaurant";

export const metadata: Metadata = {
  title: "Reservations",
  description:
    "Book a table at India Clay Oven on Clement Street, San Francisco. Dinner served seven nights a week.",
};

export default function ReservationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reservations"
        title="Book a table"
        intro="Dinner is served seven nights a week. Tell us when you would like to come in and we will confirm by phone."
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="display-md text-balance">An evening on Clement Street</h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-500">
              The dining room is quiet enough to talk in and the full bar is open through dinner.
              Larger parties are welcome. We will put tables together.
            </p>

            <dl className="mt-10 space-y-6 border-t border-cream-200 pt-8 text-[0.9375rem]">
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Dinner service
                </dt>
                <dd className="mt-1.5 leading-relaxed">
                  Seven nights a week
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
                  <span className="text-ink-500">No reservation needed. Walk in.</span>
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium tracking-[0.16em] text-ink-400 uppercase">
                  Large parties
                </dt>
                <dd className="mt-1.5 leading-relaxed">
                  For nine or more, call{" "}
                  <a href={telHref} className="text-gold underline-offset-4 hover:underline">
                    {restaurant.phone}
                  </a>{" "}
                  and we will arrange the room.
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
