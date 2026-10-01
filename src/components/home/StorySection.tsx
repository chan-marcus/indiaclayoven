import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";
import { getSiteText } from "@/lib/db";
import { Txt } from "@/components/ui/Txt";

const BLOCKS = [
  { n: 1, image: "/images/tandoor-fire.jpg", alt: "Bread baking against the wall of a charcoal-fired tandoor" },
  { n: 2, image: "/images/spices-flatlay.jpg", alt: "Whole spices laid out before grinding" },
  { n: 3, image: "/images/dining-service.jpg", alt: "A table being served in the dining room" },
] as const;

export async function StorySection() {
  const t = await getSiteText();
  return (
    <section className="section bg-cream-100/70">
      <div className="container-page">
        {/* Story intro */}
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow eyebrow-rule"><Txt k="home.story.eyebrow" text={t["home.story.eyebrow"]} /></p>
            <h2 className="display-lg mt-5 text-balance">
              <Txt k="home.story.title" text={t["home.story.title"]} />
            </h2>
          </div>
          <div className="flex flex-col justify-center gap-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-700">
            <p>
              <Txt k="home.story.p1" text={t["home.story.p1"]} />
            </p>
            <p className="text-ink-500">
              <Txt k="home.story.p2" text={t["home.story.p2"]} />
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-[0.875rem] font-medium text-gold"
            >
              More about us
              <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Three-up detail blocks */}
        <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-7 lg:mt-20 lg:gap-10">
          {BLOCKS.map((b) => (
            <article key={b.n} className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-cream-200">
                <Image
                  src={b.image}
                  alt={b.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="img-zoom object-cover"
                />
              </div>
              <p className="eyebrow mt-6"><Txt k={`home.story.block${b.n}.kicker`} text={t[`home.story.block${b.n}.kicker`]} /></p>
              <h3 className="mt-2.5 font-display text-[1.4rem] leading-snug"><Txt k={`home.story.block${b.n}.title`} text={t[`home.story.block${b.n}.title`]} /></h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-500">
                <Txt k={`home.story.block${b.n}.copy`} text={t[`home.story.block${b.n}.copy`]} />
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
