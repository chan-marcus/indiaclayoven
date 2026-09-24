import type { Restaurant } from "@/lib/types";
import { RESTAURANT_ID } from "@/lib/restaurant";

/**
 * Seed record for the restaurant. Real details taken from the client's
 * existing concepts. The live copy is in Supabase; see scripts/seed.ts.
 */
export const seedRestaurant: Restaurant = {
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
  orderEmail: {
    enabled: true,
    address: "owner@indiaclayoven.com",
  },
  owner: {
    name: "Jasprit Singh",
    email: "owner@indiaclayoven.com",
  },
  taxRate: 0.0863, // San Francisco
  deliveryFee: 4.99,
};
