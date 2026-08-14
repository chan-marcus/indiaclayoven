import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { CateringForm } from "@/components/forms/CateringForm";

export const metadata: Metadata = {
  title: "Catering & Parties",
  description:
    "Birthdays, weddings, rehearsal dinners and corporate events — hosted at India Clay Oven on Clement Street or catered at your venue.",
};

const HIGHLIGHTS = [
  {
    title: "In our dining room",
    copy: "We can seat a party in the room or take it over entirely. Tables put together, the full bar, and the clay oven running all evening.",
  },
  {
    title: "At your venue",
    copy: "Trays of tandoori, curries, rice and fresh nan delivered and set up. We scale the spice to the room.",
  },
  {
    title: "Built around your menu",
    copy: "Pick from the full menu or let us put together a spread. Vegetarian, vegan, gluten free and dairy free are never an afterthought.",
  },
];

export default function CateringPage() {
  return (
    <>
      <PageHeader
        eyebrow="Catering & Parties"
        title="Feed everyone properly"
        intro="Birthdays, engagements, rehearsals and corporate events — here on Clement Street or wherever you are."
        image="/images/clay-oven-platter.jpg"
        alt="A platter of assorted clay oven meats"
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="display-md text-balance">Three ways we do it</h2>

            <div className="mt-10 space-y-9">
              {HIGHLIGHTS.map((h, i) => (
                <article key={h.title} className="border-t border-cream-200 pt-7">
                  <div className="flex gap-5">
                    <span className="font-display text-2xl text-gold tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-xl">{h.title}</h3>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-500">
                        {h.copy}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h2 className="display-md">Tell us what you are planning</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-500">
              Send the details and we will come back with a menu and a price.
            </p>
            <div className="mt-7">
              <CateringForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
