import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";

export function Hero() {
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
          <p className="eyebrow eyebrow-rule eyebrow-on-dark">Clement Street · San Francisco</p>

          <h1 className="display-xl mt-6 text-cream">
            Experience the
            <br />
            <span className="text-gold-bright italic">Taste of India</span>
          </h1>

          <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-pretty text-cream/80">
            Charcoal-fired clay oven cooking, hand-rolled breads and slow-simmered curries,
            served in the Richmond District since the neighbourhood learned our name.
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
