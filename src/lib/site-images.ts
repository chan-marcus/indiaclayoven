import { galleryImages } from "@/lib/gallery";
import { CENTER, type Focus, type Shape } from "@/lib/photo-fit";

/*
 * Every website photo the owner can replace from Dashboard → Edit Website.
 * `page` and `section` match the Edit Website sections (site-text.ts) so each
 * photo shows beside its wording. `src` is the default; replacements are
 * stored in Supabase (site_images) and override it.
 */

type ImageField = {
  key: string;
  page: string;
  section: string;
  label: string;
  src: string;
  alt: string;
  /** The boxes this photo is cropped to, for the Adjust previews and size check. */
  shapes: readonly Shape[];
};

const img = (
  key: string,
  page: string,
  section: string,
  label: string,
  src: string,
  alt: string,
  shapes: readonly Shape[],
): ImageField => ({ key, page, section, label, src, alt, shapes });

// Usual sizes of each kind of spot, in CSS pixels.
const BANNER: readonly Shape[] = [
  { label: "Wide screens", w: 1440, h: 512 },
  { label: "Phones", w: 390, h: 420 },
];
const HERO: readonly Shape[] = [
  { label: "Wide screens", w: 1440, h: 800 },
  { label: "Phones", w: 390, h: 608 },
];
const CLOSING: readonly Shape[] = [
  { label: "Wide screens", w: 1440, h: 420 },
  { label: "Phones", w: 390, h: 520 },
];
const STORY: readonly Shape[] = [{ label: "All screens", w: 420, h: 525 }];
const GALLERY_WIDE: readonly Shape[] = [
  { label: "Wide screens", w: 544, h: 384 },
  { label: "Phones", w: 352, h: 272 },
];
const GALLERY: readonly Shape[] = [
  { label: "Wide screens", w: 288, h: 384 },
  { label: "Phones", w: 208, h: 272 },
];

export const SITE_IMAGES = [
  img("home.hero", "Home", "Top banner", "Background photo", "/images/hero-naan-curry.jpg", "Clay oven nan served alongside a slow-simmered curry", HERO),
  img("home.story.block1", "Home", "Our story", "Photo 1", "/images/tandoor-fire.jpg", "Bread baking against the wall of a charcoal-fired tandoor", STORY),
  img("home.story.block2", "Home", "Our story", "Photo 2", "/images/spices-flatlay.jpg", "Whole spices laid out before grinding", STORY),
  img("home.story.block3", "Home", "Our story", "Photo 3", "/images/dining-service.jpg", "A table being served in the dining room", STORY),
  ...galleryImages.map((g, i) =>
    img(`home.gallery.${i + 1}`, "Home", "Photo gallery", `Photo ${i + 1}`, g.src, g.alt, g.wide ? GALLERY_WIDE : GALLERY),
  ),
  img("home.closing", "Home", "Closing banner", "Background photo", "/images/tandoori-closeup.jpg", "", CLOSING),
  img("about.header", "About", "Top banner", "Background photo", "/images/restaurant-interior.jpg", "The dining room at India Clay Oven", BANNER),
  img("about.wide", "About", "Our story", "Full-width photo below", "/images/tandoor-fire.jpg", "Bread baking against the wall of the charcoal tandoor", [
    { label: "Wide screens", w: 1440, h: 512 },
    { label: "Phones", w: 390, h: 352 },
  ]),
  img("about.visit", "About", "Visit us", "Photo", "/images/dining-service.jpg", "A table being served in the dining room", [
    { label: "Wide screens", w: 600, h: 450 },
    { label: "Phones", w: 360, h: 270 },
  ]),
  img("catering.header", "Catering", "Top banner", "Background photo", "/images/clay-oven-platter.jpg", "A platter of assorted clay oven meats", BANNER),
] as const;

/** A website photo: where it is, and what to keep in frame when it's cropped. */
export type SitePhoto = { src: string; focus?: Focus };
export type SiteImages = Record<string, SitePhoto>;

export const IMAGE_FIELD = new Map<string, ImageField>(SITE_IMAGES.map((x) => [x.key, x]));
export const DEFAULT_IMAGES: SiteImages = Object.fromEntries(SITE_IMAGES.map((x) => [x.key, { src: x.src }]));

/** Defaults with the owner's replacements and framing laid over them. */
export const mergeImages = (overrides: Record<string, SitePhoto>): SiteImages => {
  const out = { ...DEFAULT_IMAGES };
  for (const [k, v] of Object.entries(overrides)) if (k in out) out[k] = v;
  return out;
};

/** True when a photo is the original, framed as it was. */
export const isDefaultPhoto = (key: string, p: SitePhoto | undefined) =>
  !p || (p.src === DEFAULT_IMAGES[key]?.src && (!p.focus || p.focus === CENTER));

/** Alt text: the description of the default photo, or a plain one for a replacement. */
export const imageAlt = (key: string, src: string): string => {
  const field = IMAGE_FIELD.get(key);
  if (!field) return "";
  if (src === field.src) return field.alt;
  return field.alt === "" ? "" : "A photo from India Clay Oven";
};
