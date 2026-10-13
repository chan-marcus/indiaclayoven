import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";
import { getSiteImages, getSiteText } from "@/lib/db";
import { imageAlt } from "@/lib/site-images";
import { Txt } from "@/components/ui/Txt";

const BLOCKS = [1, 2, 3] as const;

export async function StorySection() {
  const [t, img] = await Promise.all([getSiteText(), getSiteImages()]);
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
          {BLOCKS.map((n) => {
            const key = `home.story.block${n}`;
            return (
              <article key={n} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-cream-200">
                  <Image
                    src={img[key]}
                    alt={imageAlt(key, img[key])}
                    data-image-key={key}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="img-zoom object-cover"
                  />
                </div>
                <p className="eyebrow mt-6"><Txt k={`home.story.block${n}.kicker`} text={t[`home.story.block${n}.kicker`]} /></p>
                <h3 className="mt-2.5 font-display text-[1.4rem] leading-snug"><Txt k={`home.story.block${n}.title`} text={t[`home.story.block${n}.title`]} /></h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-500">
                  <Txt k={`home.story.block${n}.copy`} text={t[`home.story.block${n}.copy`]} />
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
