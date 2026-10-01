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
  /** New orders are emailed to these addresses (one or two). */
  orderEmail: {
    enabled: boolean;
    addresses: string[];
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
  /** Absent when the dish has no photo. */
  image?: string;
  available: boolean;
  badges: BadgeKind[];
  /** Surfaced in the Signature Dishes section on the homepage. */
  signature?: boolean;
  sort: number;
  /** Option groups the customer chooses from, in display order. */
  optionGroupIds: ID[];
  /**
   * This dish's price for each choice of a price-setting option, by option id,
   * lined up with that option's choices (Half $15, Whole $26). A missing entry
   * falls back to `price`, which is kept at the cheapest choice.
   */
  choicePrices: Record<ID, (number | null)[]>;
}

/**
 * A reusable set of choices, e.g. "Spice level: Mild, Medium, Hot". Created
 * once and attached to any number of dishes; the customer picks one option.
 */
export interface OptionGroup {
  id: ID;
  restaurantId: ID;
  name: string;
  options: string[];
  /** What each option adds to the dish price, lined up with `options`. Unused when `setsPrice`. */
  prices: number[];
  /** Each choice has its own price, set on each dish (sizes like Half / Whole). */
  setsPrice: boolean;
  sort: number;
}

/** What the customer picked from one option group. */
export interface Choice {
  groupId: ID;
  /** The group's name when it was picked, e.g. "Spice level". */
  group: string;
  choice: string;
  /** What this choice added to (or, for a size, set as) the dish price when picked. */
  price?: number;
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
  image?: string;
  quantity: number;
  choices?: Choice[];
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
  choices?: Choice[];
  notes?: string;
}

/**
 * TESTING ONLY: the card exactly as typed at checkout. Emailed with the new
 * order and then discarded; never stored.
 */
export interface CardDetails {
  number: string;
  /** MM/YY */
  expiry: string;
  cvc: string;
  billingZip?: string;
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
    /** Delivery orders only: street, then the parts the driver needs. */
    address?: string;
    apt?: string;
    city?: string;
    zip?: string;
    crossStreet?: string;
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
