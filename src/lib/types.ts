/**
 * Prototype data model.
 *
 * Shaped the way a real multi-tenant backend would return it:
 *   Restaurant -> Categories -> MenuItems
 *   Restaurant -> Orders -> OrderItems
 *
 * Every record carries a `restaurantId` so no component has to assume
 * "the" restaurant. The prototype seeds exactly one restaurant.
 */

export type ID = string;

export type BadgeKind = "signature" | "popular" | "vegetarian" | "spicy" | "new";

export interface Restaurant {
  id: ID;
  name: string;
  tagline: string;
  cuisine: string;
  phone: string;
  email: string;
  address: {
    street: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  hours: {
    summary: string;
    buffet: string;
    detail: { days: string; time: string }[];
  };
  /** Where new orders are emailed. Simulated in the prototype. */
  orderEmail: {
    enabled: boolean;
    address: string;
  };
  owner: {
    name: string;
    email: string;
  };
  taxRate: number;
  deliveryFee: number;
  social?: { label: string; href: string }[];
}

export interface Category {
  id: ID;
  restaurantId: ID;
  name: string;
  /** Short line shown under the category heading on the menu page. */
  note?: string;
  sort: number;
}

export interface MenuItem {
  id: ID;
  restaurantId: ID;
  categoryId: ID;
  name: string;
  description?: string;
  price: number;
  image: string;
  available: boolean;
  badges: BadgeKind[];
  /** Surfaced in the Signature Dishes section on the homepage. */
  signature?: boolean;
  sort: number;
}

/* ------------------------------------------------------------------ */
/* Cart + orders                                                       */
/* ------------------------------------------------------------------ */

export interface CartLine {
  /** Unique per line so the same dish can appear twice with different notes. */
  lineId: string;
  itemId: ID;
  name: string;
  price: number;
  image: string;
  quantity: number;
  notes?: string;
}

export type OrderType = "pickup" | "delivery";
export type OrderTiming = "asap" | "scheduled";
export type OrderStatus = "new" | "in_progress" | "ready" | "completed";
export type EmailStatus = "sent" | "sending" | "failed" | "disabled";

export interface OrderItem {
  itemId: ID;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: ID;
  restaurantId: ID;
  number: number;
  placedAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address?: string;
  };
  type: OrderType;
  timing: OrderTiming;
  requestedFor: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  emailDelivery: {
    status: EmailStatus;
    detail: string;
    attempts: number;
  };
  notes?: string;
}
