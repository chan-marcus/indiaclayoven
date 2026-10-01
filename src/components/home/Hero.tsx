import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";
import { getSiteText } from "@/lib/db";
import { Txt } from "@/components/ui/Txt";

export async function Hero() {
  const t = await getSiteText();
  return (
    <section className="relative isolate flex min-h-[38rem] items-end overflow-hidden bg-clay-dark lg:min-h-[calc(100vh-5rem)] lg:max-h-[52rem]">
      <Image
        src="/images/hero-naan-curry.jpg"
        alt="Clay oven nan served alongside a slow-simmered curry"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Legibility scrim, weighted to the bottom-left where the type sits */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-clay-dark/92 via-clay-dark/45 to-clay-dark/15"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-clay-dark/70 via-transparent to-transparent"
        aria-hidden
      />

      <div className="container-page relative z-10 pt-28 pb-14 md:pb-20">
        <div className="max-w-2xl">
          <p className="eyebrow eyebrow-rule eyebrow-on-dark"><Txt k="home.hero.eyebrow" text={t["home.hero.eyebrow"]} /></p>

          <h1 className="display-xl mt-6 text-cream">
            <Txt k="home.hero.title1" text={t["home.hero.title1"]} />
            <br />
            <span className="text-gold-bright italic"><Txt k="home.hero.title2" text={t["home.hero.title2"]} /></span>
          </h1>

          <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-pretty text-cream/80">
            <Txt k="home.hero.intro" text={t["home.hero.intro"]} />
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/menu" className="btn btn-gold group">
              Order Online
              <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link href="/reservations" className="btn btn-ghost-light">
              Make a Reservation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
