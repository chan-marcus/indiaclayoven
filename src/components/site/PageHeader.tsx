import Image from "next/image";

/**
 * Shared page masthead. Two flavours: a compact clay band (default) and an
 * image-backed variant for the editorial pages.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  image,
  alt = "",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image?: string;
  alt?: string;
}) {
  if (image) {
    return (
      <section className="relative isolate flex min-h-[24rem] items-end overflow-hidden bg-clay-dark md:min-h-[32rem]">
        <Image src={image} alt={alt} fill priority sizes="100vw" className="object-cover" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-clay-dark/92 via-clay-dark/50 to-clay-dark/20"
          aria-hidden
        />
        <div className="container-page relative z-10 pt-28 pb-14">
          <p className="eyebrow eyebrow-rule eyebrow-on-dark">{eyebrow}</p>
          <h1 className="display-lg mt-5 max-w-3xl text-balance text-cream">{title}</h1>
          {intro && (
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-pretty text-cream/75">
              {intro}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-clay-dark text-cream">
      <div className="container-page py-14 md:py-20">
        <p className="eyebrow eyebrow-rule eyebrow-on-dark">{eyebrow}</p>
        <h1 className="display-lg mt-5 max-w-3xl text-balance text-cream">{title}</h1>
        {intro && (
          <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-pretty text-cream/75">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
