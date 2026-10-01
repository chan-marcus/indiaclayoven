import type {
  BadgeKind,
  Category,
  MenuItem,
  OptionGroup,
  Order,
  OrderStatus,
  OrderTiming,
  OrderType,
  Restaurant,
} from "@/lib/types";

/* Database rows use snake_case columns; the app uses the camelCase types in
   lib/types. These converters are the only place the two meet. */

export type RestaurantRow = {
  id: string;
  name: string;
  tagline: string;
  cuisine: string;
  phone: string;
  email: string;
  address: Restaurant["address"];
  hours: Restaurant["hours"];
  order_email: Restaurant["orderEmail"];
  owner: Restaurant["owner"];
  tax_rate: number;
  delivery_fee: number;
};

export type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  note: string | null;
  sort: number;
};

export type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image: string;
  available: boolean;
  badges: BadgeKind[];
  signature: boolean;
  sort: number;
};

/** A menu item as selected with its attached option groups. */
export type MenuItemWithGroupsRow = MenuItemRow & {
  menu_item_option_groups?: { group_id: string }[];
};

/** Select string that loads a menu item with its option groups. */
export const MENU_ITEM_SELECT = "*, menu_item_option_groups(group_id)";

export type OptionGroupRow = {
  id: string;
  restaurant_id: string;
  name: string;
  options: string[];
  sort: number;
};

export type OrderRow = {
  id: string;
  restaurant_id: string;
  number: number;
  placed_at: string;
  customer: Order["customer"];
  type: OrderType;
  timing: OrderTiming;
  requested_for: string;
  items: Order["items"];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  email_delivery: Order["emailDelivery"];
  notes: string | null;
};

export const restaurantFromRow = (r: RestaurantRow): Restaurant => ({
  id: r.id,
  name: r.name,
  tagline: r.tagline,
  cuisine: r.cuisine,
  phone: r.phone,
  email: r.email,
  address: r.address,
  hours: r.hours,
  orderEmail: r.order_email,
  owner: r.owner,
  taxRate: Number(r.tax_rate),
  deliveryFee: Number(r.delivery_fee),
});

export const restaurantToRow = (r: Restaurant): RestaurantRow => ({
  id: r.id,
  name: r.name,
  tagline: r.tagline,
  cuisine: r.cuisine,
  phone: r.phone,
  email: r.email,
  address: r.address,
  hours: r.hours,
  order_email: r.orderEmail,
  owner: r.owner,
  tax_rate: r.taxRate,
  delivery_fee: r.deliveryFee,
});

export const categoryFromRow = (r: CategoryRow): Category => ({
  id: r.id,
  restaurantId: r.restaurant_id,
  name: r.name,
  note: r.note ?? undefined,
  sort: r.sort,
});

export const categoryToRow = (c: Category): CategoryRow => ({
  id: c.id,
  restaurant_id: c.restaurantId,
  name: c.name,
  note: c.note ?? null,
  sort: c.sort,
});

export const menuItemFromRow = (r: MenuItemWithGroupsRow): MenuItem => ({
  id: r.id,
  restaurantId: r.restaurant_id,
  categoryId: r.category_id,
  name: r.name,
  description: r.description ?? undefined,
  price: Number(r.price),
  image: r.image,
  available: r.available,
  badges: r.badges,
  signature: r.signature || undefined,
  sort: r.sort,
  optionGroupIds: (r.menu_item_option_groups ?? []).map((g) => g.group_id),
});

export const menuItemToRow = (i: MenuItem): MenuItemRow => ({
  id: i.id,
  restaurant_id: i.restaurantId,
  category_id: i.categoryId,
  name: i.name,
  description: i.description ?? null,
  price: i.price,
  image: i.image,
  available: i.available,
  badges: i.badges,
  signature: i.signature ?? false,
  sort: i.sort,
});

export const optionGroupFromRow = (r: OptionGroupRow): OptionGroup => ({
  id: r.id,
  restaurantId: r.restaurant_id,
  name: r.name,
  options: r.options,
  sort: r.sort,
});

export const orderFromRow = (r: OrderRow): Order => ({
  id: r.id,
  restaurantId: r.restaurant_id,
  number: r.number,
  placedAt: r.placed_at,
  customer: r.customer,
  type: r.type,
  timing: r.timing,
  requestedFor: r.requested_for,
  items: r.items,
  subtotal: Number(r.subtotal),
  tax: Number(r.tax),
  deliveryFee: Number(r.delivery_fee),
  total: Number(r.total),
  status: r.status,
  emailDelivery: r.email_delivery,
  notes: r.notes ?? undefined,
});

export const orderToRow = (o: Order): OrderRow => ({
  id: o.id,
  restaurant_id: o.restaurantId,
  number: o.number,
  placed_at: o.placedAt,
  customer: o.customer,
  type: o.type,
  timing: o.timing,
  requested_for: o.requestedFor,
  items: o.items,
  subtotal: o.subtotal,
  tax: o.tax,
  delivery_fee: o.deliveryFee,
  total: o.total,
  status: o.status,
  email_delivery: o.emailDelivery,
  notes: o.notes ?? null,
});
