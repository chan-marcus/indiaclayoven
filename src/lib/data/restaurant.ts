import type { Restaurant } from "@/lib/types";

/**
 * The single seeded restaurant for this prototype.
 * Real details taken from the client's existing concepts.
 */
export const RESTAURANT_ID = "rst_india_clay_oven";

export const restaurant: Restaurant = {
  id: RESTAURANT_ID,
  name: "India Clay Oven",
  tagline: "Restaurant & Bar",
  cuisine: "North Indian · Tandoori · Full Bar",
  phone: "(415) 751-0505",
  email: "hello@indiaclayoven.com",
  address: {
    street: "2436 Clement Street",
    line2: "between 25th & 26th Ave",
    city: "San Francisco",
    state: "CA",
    zip: "94121",
  },
  hours: {
    summary: "Open every day from 9:45am",
    buffet: "Lunch buffet 11am – 2pm daily",
    detail: [
      { days: "Monday – Thursday", time: "9:45am – 10:00pm" },
      { days: "Friday – Saturday", time: "9:45am – 10:30pm" },
      { days: "Sunday", time: "9:45am – 10:00pm" },
    ],
  },
  fax: {
    enabled: true,
    number: "(415) 751-0511",
  },
  owner: {
    name: "Harpreet Singh",
    email: "owner@indiaclayoven.com",
  },
  taxRate: 0.0863, // San Francisco
  deliveryFee: 4.99,
};

export const fullAddress = `${restaurant.address.street}, ${restaurant.address.city}, ${restaurant.address.state} ${restaurant.address.zip}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${restaurant.name}, ${fullAddress}`,
)}`;

export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  `${restaurant.name}, ${fullAddress}`,
)}&output=embed`;

export const telHref = `tel:${restaurant.phone.replace(/[^\d+]/g, "")}`;
