import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";

const BLOCKS = [
  {
    image: "/images/tandoor-fire.jpg",
    alt: "Bread baking against the wall of a charcoal-fired tandoor",
    kicker: "Heritage",
    title: "The oven never went electric",
    copy: "Our tandoor runs on charcoal from open to close — the same way this food has been cooked for centuries.",
  },
  {
    image: "/images/spices-flatlay.jpg",
    alt: "Whole spices laid out before grinding",
    kicker: "Ingredients",
    title: "Spices ground in our kitchen",
    copy: "Whole spices, bloomed in hot oil and ground here rather than bought by the case. Onions browned slowly, curries left to simmer.",
  },
  {
    image: "/images/dining-service.jpg",
    alt: "A table being served in the dining room",
    kicker: "Hospitality",
    title: "Regulars bring their families",
    copy: "At lunch the room fills for the buffet. In the evening the full menu comes out, along with the bar. First-timers usually come back.",
  },
];

export function StorySection() {
  return (
    <section className="section bg-cream-100/70">
      <div className="container-page">
        {/* Story intro */}
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow eyebrow-rule">Our Story</p>
            <h2 className="display-lg mt-5 text-balance">
              Cooked over charcoal, the way it has always been done
            </h2>
          </div>
          <div className="flex flex-col justify-center gap-5 text-[1.0625rem] leading-relaxed text-pretty text-ink-700">
            <p>
              India Clay Oven has served the Richmond District from a small storefront on Clement
              Street for many years. The cooking is traditional North Indian: a charcoal-fired
              tandoor for breads and kababs, heavy pots for the curries, and spices ground in the
              kitchen.
            </p>
            <p className="text-ink-500">
              Come in for the lunch buffet, sit down for dinner with a drink from the full bar, or
              take it home. Every dish can be made gluten free, vegan or dairy free on request.
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
            <article key={b.title} className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-cream-200">
                <Image
                  src={b.image}
                  alt={b.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="img-zoom object-cover"
                />
              </div>
              <p className="eyebrow mt-6">{b.kicker}</p>
              <h3 className="mt-2.5 font-display text-[1.4rem] leading-snug">{b.title}</h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-500">{b.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
