"use server";

/*
 * Every write to the database goes through here, using the secret key.
 *
 * These are public HTTP endpoints: anyone can call them, not only this UI.
 * There is no owner login yet, so the owner-only actions below are open.
 * When login is added, check the session at the top of each owner action.
 */

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase/server";
import { getMenuItems, getOrders, getRestaurant } from "@/lib/db";
import { RESTAURANT_ID, RESTAURANT_TIME_ZONE } from "@/lib/restaurant";
import {
  categoryFromRow,
  menuItemFromRow,
  orderFromRow,
  restaurantFromRow,
  restaurantToRow,
  type CategoryRow,
  type MenuItemRow,
  type OrderRow,
  type RestaurantRow,
} from "@/lib/db-rows";
import type { ActionResult } from "@/lib/action-result";
import type {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  OrderTiming,
  OrderType,
  Restaurant,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type Result = { data: unknown; error: { message: string } | null };

/** A problem the person can fix; its message is shown to them. */
class InputError extends Error {}

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof InputError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong on our side. Please try again." };
  }
}

function check<T = unknown>(res: Result, what: string): T {
  if (res.error) throw new Error(`Could not ${what}: ${res.error.message}`);
  return res.data as T;
}

function text(value: unknown, field: string, max = 200): string {
  if (typeof value !== "string" || !value.trim()) throw new InputError(`${field} is required`);
  if (value.length > max) throw new InputError(`${field} is too long`);
  return value.trim();
}

function optionalText(value: unknown, field: string, max = 500): string | null {
  if (value === undefined || value === null || value === "") return null;
  return text(value, field, max);
}

function money(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 10_000) throw new InputError(`${field} must be a valid amount`);
  return Math.round(n * 100) / 100;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const sentNow = () =>
  `Sent ${new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: RESTAURANT_TIME_ZONE,
  })}`;

/** Menu and settings changes appear on the public site. */
const refreshSite = () => revalidatePath("/", "layout");

/* ------------------------------------------------------------------ */
/* Menu (owner)                                                        */
/* ------------------------------------------------------------------ */

export async function setItemAvailability(id: string, available: boolean): Promise<ActionResult<void>> {
  return run(async () => {
    check(
      await supabase
        .from("menu_items")
        .update({ available: Boolean(available) })
        .eq("id", text(id, "Item"))
        .eq("restaurant_id", RESTAURANT_ID),
      "update availability",
    );
    refreshSite();
  });
}

type ItemInput = Pick<MenuItem, "name" | "description" | "price" | "categoryId" | "available">;

export async function updateMenuItem(id: string, patch: Partial<ItemInput>): Promise<ActionResult<MenuItem>> {
  return run(async () => {
    const update: Partial<MenuItemRow> = {};
    if ("name" in patch) update.name = text(patch.name, "Name", 120);
    if ("description" in patch) update.description = optionalText(patch.description, "Description");
    if ("price" in patch) update.price = money(patch.price, "Price");
    if ("categoryId" in patch) update.category_id = text(patch.categoryId, "Category");
    if ("available" in patch) update.available = Boolean(patch.available);

    const row = check<MenuItemRow>(
      await supabase
        .from("menu_items")
        .update(update)
        .eq("id", text(id, "Item"))
        .eq("restaurant_id", RESTAURANT_ID)
        .select()
        .single(),
      "save the dish",
    );
    refreshSite();
    return menuItemFromRow(row);
  });
}

export async function createMenuItem(input: ItemInput & { image?: string }): Promise<ActionResult<MenuItem>> {
  return run(async () => {
    const last = check<{ sort: number }[]>(
      await supabase
        .from("menu_items")
        .select("sort")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("sort", { ascending: false })
        .limit(1),
      "add the dish",
    );

    const row = check<MenuItemRow>(
      await supabase
        .from("menu_items")
        .insert({
          id: `itm_${crypto.randomUUID()}`,
          restaurant_id: RESTAURANT_ID,
          category_id: text(input.categoryId, "Category"),
          name: text(input.name, "Name", 120),
          description: optionalText(input.description, "Description"),
          price: money(input.price, "Price"),
          image: input.image?.startsWith("/images/") ? input.image : "/images/curry-spread.jpg",
          available: input.available ?? true,
          badges: [],
          signature: false,
          sort: (last[0]?.sort ?? 0) + 1,
        })
        .select()
        .single(),
      "add the dish",
    );
    refreshSite();
    return menuItemFromRow(row);
  });
}

export async function deleteMenuItem(id: string): Promise<ActionResult<void>> {
  return run(async () => {
    check(
      await supabase
        .from("menu_items")
        .delete()
        .eq("id", text(id, "Item"))
        .eq("restaurant_id", RESTAURANT_ID),
      "remove the dish",
    );
    refreshSite();
  });
}

export async function createCategory(name: string): Promise<ActionResult<Category>> {
  return run(async () => {
    const last = check<{ sort: number }[]>(
      await supabase
        .from("categories")
        .select("sort")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("sort", { ascending: false })
        .limit(1),
      "add the category",
    );
    const row = check<CategoryRow>(
      await supabase
        .from("categories")
        .insert({
          id: `cat_${crypto.randomUUID()}`,
          restaurant_id: RESTAURANT_ID,
          name: text(name, "Category name", 80),
          note: null,
          sort: (last[0]?.sort ?? 0) + 1,
        })
        .select()
        .single(),
      "add the category",
    );
    refreshSite();
    return categoryFromRow(row);
  });
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export type PlaceOrderInput = {
  customer: { name: string; phone: string; email: string; address?: string };
  type: OrderType;
  timing: OrderTiming;
  requestedFor: string;
  items: { itemId: string; quantity: number; notes?: string }[];
  notes?: string;
};

/**
 * Public: called by the customer checkout. Prices, tax and totals are worked
 * out here from the database, never trusted from the browser.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<ActionResult<Order>> {
  return run(async () => {
    if (input.type !== "pickup" && input.type !== "delivery") throw new InputError("Invalid order type");
    if (input.timing !== "asap" && input.timing !== "scheduled") throw new InputError("Invalid timing");
    const requestedFor = new Date(input.requestedFor);
    if (Number.isNaN(requestedFor.getTime())) throw new InputError("Invalid requested time");
    if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 100) {
      throw new InputError("Your order is empty");
    }

    const [restaurant, menu] = await Promise.all([getRestaurant(), getMenuItems()]);
    const byId = new Map(menu.map((m) => [m.id, m]));

    const items = input.items.map((line) => {
      const dish = byId.get(line.itemId);
      if (!dish) throw new InputError("One of the dishes in your order is no longer on the menu");
      if (!dish.available) throw new InputError(`${dish.name} is sold out today`);
      const quantity = Math.floor(Number(line.quantity));
      if (!(quantity >= 1 && quantity <= 99)) throw new InputError("Invalid quantity");
      return {
        itemId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity,
        notes: optionalText(line.notes, "Item note", 300) ?? undefined,
      };
    });

    const isDelivery = input.type === "delivery";
    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const tax = round2(subtotal * restaurant.taxRate);
    const deliveryFee = isDelivery ? restaurant.deliveryFee : 0;

    const email = text(input.customer?.email, "Email", 200);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new InputError("That email does not look right");

    const row = check<OrderRow>(
      await supabase
        .from("orders")
        .insert({
          id: `ord_${crypto.randomUUID()}`,
          restaurant_id: RESTAURANT_ID,
          customer: {
            name: text(input.customer?.name, "Name", 120),
            phone: text(input.customer?.phone, "Phone", 40),
            email,
            address: isDelivery ? text(input.customer?.address, "Delivery address", 300) : undefined,
          },
          type: input.type,
          timing: input.timing,
          requested_for: requestedFor.toISOString(),
          items,
          subtotal,
          tax,
          delivery_fee: deliveryFee,
          total: round2(subtotal + tax + deliveryFee),
          status: "new",
          email_delivery: restaurant.orderEmail.enabled
            ? { status: "sent", detail: sentNow(), attempts: 1 }
            : { status: "disabled", detail: "Order emails are off", attempts: 0 },
          notes: optionalText(input.notes, "Order note", 1000),
        })
        .select()
        .single(),
      "place your order",
    );
    return orderFromRow(row);
  });
}

export async function listOrders(): Promise<ActionResult<Order[]>> {
  return run(async () => {
    return getOrders();
  });
}

const STATUSES: OrderStatus[] = ["new", "in_progress", "ready", "completed"];

export async function setOrderStatus(id: string, status: OrderStatus): Promise<ActionResult<void>> {
  return run(async () => {
    if (!STATUSES.includes(status)) throw new InputError("Invalid status");
    check(
      await supabase
        .from("orders")
        .update({ status })
        .eq("id", text(id, "Order"))
        .eq("restaurant_id", RESTAURANT_ID),
      "update the order",
    );
  });
}

/** Email sending is simulated for now: a resend is recorded as sent. */
export async function resendOrderEmail(id: string): Promise<ActionResult<Order>> {
  return run(async () => {
    const current = check<Pick<OrderRow, "email_delivery">>(
      await supabase
        .from("orders")
        .select("email_delivery")
        .eq("id", text(id, "Order"))
        .eq("restaurant_id", RESTAURANT_ID)
        .single(),
      "resend the email",
    );
    const row = check<OrderRow>(
      await supabase
        .from("orders")
        .update({
          email_delivery: {
            status: "sent",
            detail: sentNow(),
            attempts: current.email_delivery.attempts + 1,
          },
        })
        .eq("id", id)
        .eq("restaurant_id", RESTAURANT_ID)
        .select()
        .single(),
      "resend the email",
    );
    return orderFromRow(row);
  });
}

/* ------------------------------------------------------------------ */
/* Settings (owner)                                                    */
/* ------------------------------------------------------------------ */

type SettingsInput = Pick<Restaurant, "name" | "phone" | "address" | "hours" | "orderEmail" | "owner">;

export async function updateRestaurant(input: SettingsInput): Promise<ActionResult<Restaurant>> {
  return run(async () => {
    const current = await getRestaurant();
    const next: Restaurant = {
      ...current,
      name: text(input.name, "Restaurant name", 120),
      phone: text(input.phone, "Phone", 40),
      address: {
        ...current.address,
        street: text(input.address?.street, "Street address", 200),
        city: text(input.address?.city, "City", 100),
        state: text(input.address?.state, "State", 40),
        zip: text(input.address?.zip, "ZIP", 20),
      },
      hours: {
        ...current.hours,
        summary: text(input.hours?.summary, "Hours", 200),
        buffet: text(input.hours?.buffet, "Buffet hours", 200),
      },
      orderEmail: {
        enabled: Boolean(input.orderEmail?.enabled),
        address: input.orderEmail?.enabled
          ? text(input.orderEmail.address, "Order email address", 200)
          : (optionalText(input.orderEmail?.address, "Order email address", 200) ??
            current.orderEmail.address),
      },
      owner: {
        name: text(input.owner?.name, "Owner name", 120),
        email: text(input.owner?.email, "Owner email", 200),
      },
    };

    const row = check<RestaurantRow>(
      await supabase
        .from("restaurants")
        .update({ ...restaurantToRow(next), updated_at: new Date().toISOString() })
        .eq("id", RESTAURANT_ID)
        .select()
        .single(),
      "save settings",
    );
    refreshSite();
    return restaurantFromRow(row);
  });
}
