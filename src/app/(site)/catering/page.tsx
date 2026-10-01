import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { CateringForm } from "@/components/forms/CateringForm";
import { getSiteText } from "@/lib/db";
import { Lines } from "@/components/ui/Lines";

export const metadata: Metadata = {
  title: "Catering & Parties",
  description:
    "Birthdays, weddings, rehearsal dinners and corporate events. Hosted at India Clay Oven on Clement Street or catered at your venue.",
};

const HIGHLIGHTS = [1, 2, 3] as const;

export default async function CateringPage() {
  const t = await getSiteText();
  return (
    <>
      <PageHeader
        eyebrow={t["catering.header.eyebrow"]}
        title={t["catering.header.title"]}
        intro={t["catering.header.intro"]}
        image="/images/clay-oven-platter.jpg"
        alt="A platter of assorted clay oven meats"
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="display-md text-balance">{t["catering.ways.title"]}</h2>

            <div className="mt-10 space-y-9">
              {HIGHLIGHTS.map((n, i) => (
                <article key={n} className="border-t border-cream-200 pt-7">
                  <div className="flex gap-5">
                    <span className="font-display text-2xl text-gold tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-xl">{t[`catering.ways.${n}.title`]}</h3>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-500">
                        <Lines text={t[`catering.ways.${n}.copy`]} />
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h2 className="display-md">{t["catering.form.title"]}</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-500">
              <Lines text={t["catering.form.intro"]} />
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
