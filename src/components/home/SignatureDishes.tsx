import Image from "next/image";
import Link from "next/link";
import { getCategories, getMenuItems, getSiteText } from "@/lib/db";
import { currency } from "@/lib/format";
import { BadgeOnDark } from "@/components/ui/Badge";
import { IconArrowRight } from "@/components/ui/icons";

/**
 * Each card is a single link into the menu with ?item=<id>, which opens that
 * dish's detail modal on arrival: one tap from "that looks good" to ordering.
 */
export async function SignatureDishes() {
  const [items, categories, t] = await Promise.all([getMenuItems(), getCategories(), getSiteText()]);
  const dishes = items.filter((i) => i.signature);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "";

  return (
    <section className="section">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow eyebrow-rule">{t["home.signature.eyebrow"]}</p>
            <h2 className="display-lg mt-5 max-w-xl text-balance">
              {t["home.signature.title"]}
            </h2>
          </div>
          <Link href="/menu" className="btn btn-secondary group">
            View Full Menu
            <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {dishes.map((dish) => (
            <Link
              key={dish.id}
              href={`/menu?item=${dish.id}`}
              className="group flex flex-col focus-visible:outline-none"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-cream-200">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="img-zoom object-cover"
                />
                {/* Subtle overlay deepens on hover so the type stays readable */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-clay-dark/75 via-clay-dark/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />

                {dish.badges.length > 0 && (
                  <div className="absolute top-3.5 left-3.5">
                    <BadgeOnDark>{dish.badges[0]}</BadgeOnDark>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[0.6875rem] tracking-[0.14em] text-gold-bright/85 uppercase">
                    {categoryName(dish.categoryId)}
                  </p>
                  <h3 className="mt-1 font-display text-[1.3rem] leading-tight text-cream">
                    {dish.name}
                  </h3>
                </div>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <p className="flex-1 text-[0.875rem] leading-relaxed text-ink-500">
                  {dish.description}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
                <span className="text-[0.9375rem] font-medium tabular-nums">
                  {currency(dish.price)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-gold">
                  Add to order
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
