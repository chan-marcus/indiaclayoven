import { galleryImages } from "@/lib/gallery";

/*
 * Every website photo the owner can replace from Dashboard → Edit Website.
 * `page` and `section` match the Edit Website sections (site-text.ts) so each
 * photo shows beside its wording. `src` is the default; replacements are
 * stored in Supabase (site_images) and override it.
 */

type ImageField = { key: string; page: string; section: string; label: string; src: string; alt: string };

const img = (key: string, page: string, section: string, label: string, src: string, alt: string): ImageField => ({
  key,
  page,
  section,
  label,
  src,
  alt,
});

export const SITE_IMAGES = [
  img("home.hero", "Home", "Top banner", "Background photo", "/images/hero-naan-curry.jpg", "Clay oven nan served alongside a slow-simmered curry"),
  img("home.story.block1", "Home", "Our story", "Photo 1", "/images/tandoor-fire.jpg", "Bread baking against the wall of a charcoal-fired tandoor"),
  img("home.story.block2", "Home", "Our story", "Photo 2", "/images/spices-flatlay.jpg", "Whole spices laid out before grinding"),
  img("home.story.block3", "Home", "Our story", "Photo 3", "/images/dining-service.jpg", "A table being served in the dining room"),
  ...galleryImages.map((g, i) =>
    img(`home.gallery.${i + 1}`, "Home", "Photo gallery", `Photo ${i + 1}`, g.src, g.alt),
  ),
  img("home.closing", "Home", "Closing banner", "Background photo", "/images/tandoori-closeup.jpg", ""),
  img("about.header", "About", "Top banner", "Background photo", "/images/restaurant-interior.jpg", "The dining room at India Clay Oven"),
  img("about.wide", "About", "Our story", "Full-width photo below", "/images/tandoor-fire.jpg", "Bread baking against the wall of the charcoal tandoor"),
  img("about.visit", "About", "Visit us", "Photo", "/images/dining-service.jpg", "A table being served in the dining room"),
  img("catering.header", "Catering", "Top banner", "Background photo", "/images/clay-oven-platter.jpg", "A platter of assorted clay oven meats"),
] as const;

export type ImageKey = (typeof SITE_IMAGES)[number]["key"] | `home.gallery.${number}`;
export type SiteImages = Record<string, string>;

export const IMAGE_FIELD = new Map<string, ImageField>(SITE_IMAGES.map((x) => [x.key, x]));
export const DEFAULT_IMAGES: SiteImages = Object.fromEntries(SITE_IMAGES.map((x) => [x.key, x.src]));

/** Defaults with the owner's replacements laid over them. */
export const mergeImages = (overrides: Record<string, string>): SiteImages => {
  const out = { ...DEFAULT_IMAGES };
  for (const [k, v] of Object.entries(overrides)) if (k in out) out[k] = v;
  return out;
};

/** Alt text: the description of the default photo, or a plain one for a replacement. */
export const imageAlt = (key: string, src: string): string => {
  const field = IMAGE_FIELD.get(key);
  if (!field) return "";
  if (src === field.src) return field.alt;
  return field.alt === "" ? "" : "A photo from India Clay Oven";
};
