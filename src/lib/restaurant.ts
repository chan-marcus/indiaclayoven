import type { Restaurant } from "@/lib/types";

export const RESTAURANT_ID = "rst_india_clay_oven";

/** Times shown to the owner, such as "Sent 2:42 PM", are in the restaurant's local time. */
export const RESTAURANT_TIME_ZONE = "America/Los_Angeles";

export const fullAddress = (r: Restaurant) =>
  `${r.address.street}, ${r.address.city}, ${r.address.state} ${r.address.zip}`;

export const mapsUrl = (r: Restaurant) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name}, ${fullAddress(r)}`)}`;

export const mapsEmbedUrl = (r: Restaurant) =>
  `https://www.google.com/maps?q=${encodeURIComponent(`${r.name}, ${fullAddress(r)}`)}&output=embed`;

export const telHref = (r: Restaurant) => `tel:${r.phone.replace(/[^\d+]/g, "")}`;
