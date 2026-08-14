"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { galleryImages } from "@/lib/data/menu";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";

/**
 * Horizontal photography rail. Native scroll + snap does the work, so touch
 * and trackpad swiping behave natively; the arrows are a desktop affordance.
 */
export function FoodGallery() {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    sync();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: "smooth" });
  };

  return (
    <section className="section bg-clay-dark text-cream">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow eyebrow-rule eyebrow-on-dark">From our guests</p>
            <h2 className="display-lg mt-5 max-w-lg text-balance text-cream">
              Photographed on the table, not in a studio
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              aria-label="Previous photographs"
              className="flex h-11 w-11 items-center justify-center rounded-xs border border-cream/30 text-cream transition-all duration-200 hover:border-cream hover:bg-cream/10 disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              aria-label="More photographs"
              className="flex h-11 w-11 items-center justify-center rounded-xs border border-cream/30 text-cream transition-all duration-200 hover:border-cream hover:bg-cream/10 disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Rail bleeds to the viewport edge so it reads as a gallery, not a grid */}
      <div
        ref={railRef}
        className="no-scrollbar mt-11 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 md:gap-5 md:px-10"
      >
        {galleryImages.map((g, i) => (
          <figure
            key={g.src + i}
            className={`group relative shrink-0 snap-start overflow-hidden rounded-sm bg-clay ${
              g.wide
                ? "h-[17rem] w-[22rem] md:h-[24rem] md:w-[34rem]"
                : "h-[17rem] w-[13rem] md:h-[24rem] md:w-[18rem]"
            }`}
          >
            <Image
              src={g.src}
              alt={g.alt}
              fill
              sizes="(max-width: 768px) 60vw, 34rem"
              className="img-zoom object-cover"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
