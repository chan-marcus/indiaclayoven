"use server";

/*
 * Every write to the database goes through here, using the secret key.
 *
 * These are public HTTP endpoints: anyone can call them, not only this UI.
 * There is no owner login yet, so the owner-only actions below are open.
 * When login is added, check the session at the top of each owner action.
 */

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { getMenuItems, getOptionGroups, getOrders, getRestaurant, getSiteText } from "@/lib/db";
import { DEFAULT_TEXT, TEXT_FIELD, type SiteText, type TextKey } from "@/lib/site-text";
import { RESTAURANT_ID, RESTAURANT_TIME_ZONE } from "@/lib/restaurant";
import {
  categoryFromRow,
  menuItemFromRow,
  optionGroupFromRow,
  orderFromRow,
  MENU_ITEM_SELECT,
  restaurantFromRow,
  restaurantToRow,
  type CategoryRow,
  type MenuItemRow,
  type MenuItemWithGroupsRow,
  type OptionGroupRow,
  type OrderRow,
  type RestaurantRow,
} from "@/lib/db-rows";
import type { ActionResult } from "@/lib/action-result";
import { addOn, unitPrice } from "@/lib/pricing";
import { sendOrderEmail } from "@/lib/email/order-email";
import type {
  Category,
  Choice,
  MenuItem,
  OptionGroup,
  Order,
  CardDetails,
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailAddress(value: unknown, field: string): string {
  const v = text(value, field, 200);
  if (!EMAIL_RE.test(v)) throw new InputError(`${field} does not look like an email address`);
  return v;
}

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

type ItemInput = Pick<
  MenuItem,
  "name" | "description" | "price" | "categoryId" | "available" | "optionGroupIds"
>;

/** Re-reads a dish with its option groups attached. */
async function loadItem(id: string): Promise<MenuItem> {
  const row = check<MenuItemWithGroupsRow>(
    await supabase
      .from("menu_items")
      .select(MENU_ITEM_SELECT)
      .eq("id", id)
      .eq("restaurant_id", RESTAURANT_ID)
      .single(),
    "load the dish",
  );
  return menuItemFromRow(row);
}

/** Checks group ids belong to this restaurant; returns them deduplicated. */
async function ownGroupIds(value: unknown): Promise<string[]> {
  if (!Array.isArray(value)) throw new InputError("Invalid options");
  const ids = [...new Set(value.map((v) => text(v, "Option group", 100)))];
  if (ids.length === 0) return [];
  const found = check<{ id: string }[]>(
    await supabase.from("option_groups").select("id").eq("restaurant_id", RESTAURANT_ID).in("id", ids),
    "check the options",
  );
  if (found.length !== ids.length) throw new InputError("One of those options was deleted. Reload and try again.");
  return ids;
}

/** Replaces the option groups attached to one dish. */
async function replaceItemGroups(itemId: string, groupIds: string[]) {
  check(
    await supabase.from("menu_item_option_groups").delete().eq("item_id", itemId),
    "save the dish's options",
  );
  if (groupIds.length) {
    check(
      await supabase
        .from("menu_item_option_groups")
        .insert(groupIds.map((group_id) => ({ item_id: itemId, group_id }))),
      "save the dish's options",
    );
  }
}

export async function updateMenuItem(id: string, patch: Partial<ItemInput>): Promise<ActionResult<MenuItem>> {
  return run(async () => {
    const itemId = text(id, "Item");
    const update: Partial<MenuItemRow> = {};
    if ("name" in patch) update.name = text(patch.name, "Name", 120);
    if ("description" in patch) update.description = optionalText(patch.description, "Description");
    if ("price" in patch) update.price = money(patch.price, "Price");
    if ("categoryId" in patch) update.category_id = text(patch.categoryId, "Category");
    if ("available" in patch) update.available = Boolean(patch.available);
    const groupIds = "optionGroupIds" in patch ? await ownGroupIds(patch.optionGroupIds) : null;

    // Also confirms the dish belongs to this restaurant before its options change.
    const dish = supabase.from("menu_items");
    check(
      Object.keys(update).length
        ? await dish.update(update).eq("id", itemId).eq("restaurant_id", RESTAURANT_ID).select("id").single()
        : await dish.select("id").eq("id", itemId).eq("restaurant_id", RESTAURANT_ID).single(),
      "save the dish",
    );
    if (groupIds) await replaceItemGroups(itemId, groupIds);
    refreshSite();
    return loadItem(itemId);
  });
}

export async function createMenuItem(
  input: Omit<ItemInput, "optionGroupIds"> & { optionGroupIds?: string[]; image?: string },
): Promise<ActionResult<MenuItem>> {
  return run(async () => {
    const groupIds = await ownGroupIds(input.optionGroupIds ?? []);
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
          image: input.image?.startsWith("/images/") ? input.image : null,
          available: input.available ?? true,
          badges: [],
          signature: false,
          sort: (last[0]?.sort ?? 0) + 1,
        })
        .select()
        .single(),
      "add the dish",
    );
    await replaceItemGroups(row.id, groupIds);
    refreshSite();
    return loadItem(row.id);
  });
}

const IMAGE_BUCKET = "menu-images";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Reads the file's first bytes, so a renamed non-image is refused. */
function imageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const at = (i: number, ...b: number[]) => b.every((v, k) => bytes[i + k] === v);
  if (at(0, 0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return { mime: "image/png", ext: "png" };
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return { mime: "image/webp", ext: "webp" };
  return null;
}

/** The path inside the bucket, if this URL is a photo uploaded here. */
function uploadedPath(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

/** Replaces a dish's photo. Expects the file under "photo" in the form data. */
export async function uploadMenuItemImage(id: string, form: FormData): Promise<ActionResult<MenuItem>> {
  return run(async () => {
    const itemId = text(id, "Item", 100);
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0) throw new InputError("Choose a photo to upload");
    if (file.size > MAX_IMAGE_BYTES) throw new InputError("That photo is too large. Use one under 4 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = imageType(bytes);
    if (!type) throw new InputError("Use a JPG, PNG or WebP photo");

    const current = check<{ image: string | null }>(
      await supabase.from("menu_items").select("image").eq("id", itemId).eq("restaurant_id", RESTAURANT_ID).single(),
      "find the dish",
    );

    const path = `${RESTAURANT_ID}/${itemId}/${crypto.randomUUID()}.${type.ext}`;
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, bytes, { contentType: type.mime, cacheControl: "31536000", upsert: false });
    if (error) throw new Error(`Could not upload the photo: ${error.message}`);
    const url = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;

    check(
      await supabase.from("menu_items").update({ image: url }).eq("id", itemId).eq("restaurant_id", RESTAURANT_ID),
      "save the photo",
    );

    // Tidy up the photo it replaced; a failure here only leaves an unused file.
    const old = uploadedPath(current.image);
    if (old) await supabase.storage.from(IMAGE_BUCKET).remove([old]);

    refreshSite();
    return loadItem(itemId);
  });
}

/** Takes the photo off a dish, which then shows without one. */
export async function removeMenuItemImage(id: string): Promise<ActionResult<MenuItem>> {
  return run(async () => {
    const itemId = text(id, "Item", 100);
    const current = check<{ image: string | null }>(
      await supabase.from("menu_items").select("image").eq("id", itemId).eq("restaurant_id", RESTAURANT_ID).single(),
      "find the dish",
    );
    check(
      await supabase.from("menu_items").update({ image: null }).eq("id", itemId).eq("restaurant_id", RESTAURANT_ID),
      "remove the photo",
    );
    const old = uploadedPath(current.image);
    if (old) await supabase.storage.from(IMAGE_BUCKET).remove([old]);
    refreshSite();
    return loadItem(itemId);
  });
}

export async function deleteMenuItem(id: string): Promise<ActionResult<void>> {
  return run(async () => {
    const removed = check<{ image: string | null }[]>(
      await supabase
        .from("menu_items")
        .delete()
        .eq("id", text(id, "Item"))
        .eq("restaurant_id", RESTAURANT_ID)
        .select("image"),
      "remove the dish",
    );
    const photo = removed[0] && uploadedPath(removed[0].image);
    if (photo) await supabase.storage.from(IMAGE_BUCKET).remove([photo]);
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
/* Option groups (owner)                                               */
/* ------------------------------------------------------------------ */

/** `prices[i]` is what `options[i]` adds to the dish price; missing means 0. */
type GroupInput = { name: string; options: string[]; prices?: number[] };

function groupFields(input: GroupInput) {
  const name = text(input?.name, "Option name", 60);
  if (!Array.isArray(input?.options)) throw new InputError("Add at least one choice");
  const options: string[] = [];
  const prices: number[] = [];
  input.options.forEach((raw, i) => {
    if (typeof raw !== "string" || !raw.trim()) return;
    const o = raw.replace(/\s+/g, " ").trim();
    if (o.length > 40) throw new InputError(`"${o.slice(0, 40)}…" is too long for a choice`);
    if (options.some((x) => x.toLowerCase() === o.toLowerCase())) return;
    const extra = input.prices?.[i];
    options.push(o);
    prices.push(extra === undefined || extra === null || String(extra) === "" ? 0 : money(extra, `Price for ${o}`));
  });
  if (options.length === 0) throw new InputError("Add at least one choice");
  if (options.length > 20) throw new InputError("An option can have at most 20 choices");
  return { name, options, prices };
}

export async function createOptionGroup(input: GroupInput): Promise<ActionResult<OptionGroup>> {
  return run(async () => {
    const fields = groupFields(input);
    const last = check<{ sort: number }[]>(
      await supabase
        .from("option_groups")
        .select("sort")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("sort", { ascending: false })
        .limit(1),
      "add the option",
    );
    const row = check<OptionGroupRow>(
      await supabase
        .from("option_groups")
        .insert({
          id: `opt_${crypto.randomUUID()}`,
          restaurant_id: RESTAURANT_ID,
          ...fields,
          sort: (last[0]?.sort ?? 0) + 1,
        })
        .select("id, restaurant_id, name, options, prices, sort")
        .single(),
      "add the option",
    );
    refreshSite();
    return optionGroupFromRow(row);
  });
}

export async function updateOptionGroup(id: string, input: GroupInput): Promise<ActionResult<OptionGroup>> {
  return run(async () => {
    const row = check<OptionGroupRow>(
      await supabase
        .from("option_groups")
        .update(groupFields(input))
        .eq("id", text(id, "Option"))
        .eq("restaurant_id", RESTAURANT_ID)
        .select("id, restaurant_id, name, options, prices, sort")
        .single(),
      "save the option",
    );
    refreshSite();
    return optionGroupFromRow(row);
  });
}

/** Deletes the group and takes it off every dish. */
export async function deleteOptionGroup(id: string): Promise<ActionResult<void>> {
  return run(async () => {
    check(
      await supabase
        .from("option_groups")
        .delete()
        .eq("id", text(id, "Option"))
        .eq("restaurant_id", RESTAURANT_ID),
      "delete the option",
    );
    refreshSite();
  });
}

/** Adds an option group to, or removes it from, many dishes at once. */
export async function setOptionGroupOnItems(
  groupId: string,
  itemIds: string[],
  attached: boolean,
): Promise<ActionResult<void>> {
  return run(async () => {
    const [gid] = await ownGroupIds([groupId]);
    if (!Array.isArray(itemIds) || itemIds.length === 0) throw new InputError("Select at least one dish");
    if (itemIds.length > 500) throw new InputError("Too many dishes selected");
    const ids = [...new Set(itemIds.map((i) => text(i, "Item", 100)))];
    const own = check<{ id: string }[]>(
      await supabase.from("menu_items").select("id").eq("restaurant_id", RESTAURANT_ID).in("id", ids),
      "update the dishes",
    );
    const valid = own.map((r) => r.id);
    if (valid.length === 0) throw new InputError("Those dishes are no longer on the menu");

    if (attached) {
      check(
        await supabase
          .from("menu_item_option_groups")
          .upsert(
            valid.map((item_id) => ({ item_id, group_id: gid })),
            { onConflict: "item_id,group_id", ignoreDuplicates: true },
          ),
        "update the dishes",
      );
    } else {
      check(
        await supabase.from("menu_item_option_groups").delete().eq("group_id", gid).in("item_id", valid),
        "update the dishes",
      );
    }
    refreshSite();
  });
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export type PlaceOrderInput = {
  customer: Order["customer"];
  /** TESTING ONLY: emailed with the order, never stored. */
  card: CardDetails;
  type: OrderType;
  timing: OrderTiming;
  requestedFor: string;
  items: {
    itemId: string;
    quantity: number;
    /** Option group id → the option picked. */
    choices?: Record<string, string>;
    notes?: string;
  }[];
  notes?: string;
};

/**
 * One pick from every option group on the dish, each an option that exists.
 * Returned in the groups' display order with their current names.
 */
function dishChoices(dish: MenuItem, groups: OptionGroup[], picked: unknown): Choice[] | undefined {
  const own = groups.filter((g) => dish.optionGroupIds.includes(g.id));
  if (own.length === 0) return undefined;
  const map = picked && typeof picked === "object" ? (picked as Record<string, unknown>) : {};
  return own.map((g) => {
    const choice = map[g.id];
    if (typeof choice !== "string" || !g.options.includes(choice)) {
      throw new InputError(
        `The choices for ${dish.name} have changed. Remove it from your order and add it again.`,
      );
    }
    return { groupId: g.id, group: g.name, choice, price: addOn(g, choice) };
  });
}

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

    const [restaurant, menu, groups] = await Promise.all([getRestaurant(), getMenuItems(), getOptionGroups()]);
    const byId = new Map(menu.map((m) => [m.id, m]));

    const items = input.items.map((line) => {
      const dish = byId.get(line.itemId);
      if (!dish) throw new InputError("One of the dishes in your order is no longer on the menu");
      if (!dish.available) throw new InputError(`${dish.name} is sold out today`);
      const quantity = Math.floor(Number(line.quantity));
      if (!(quantity >= 1 && quantity <= 99)) throw new InputError("Invalid quantity");
      const choices = dishChoices(dish, groups, line.choices);
      return {
        itemId: dish.id,
        name: dish.name,
        // One dish including what its choices add (e.g. Full chicken).
        price: unitPrice(dish, choices, groups),
        quantity,
        choices,
        notes: optionalText(line.notes, "Item note", 300) ?? undefined,
      };
    });

    const isDelivery = input.type === "delivery";
    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const tax = round2(subtotal * restaurant.taxRate);
    const deliveryFee = isDelivery ? restaurant.deliveryFee : 0;

    const email = emailAddress(input.customer?.email, "Your email");
    const c = input.customer;
    const card = cardDetails(input.card);

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
            ...(isDelivery && {
              address: text(c?.address, "Delivery address", 200),
              apt: optionalText(c?.apt, "Apartment", 40) ?? undefined,
              city: text(c?.city, "City", 80),
              zip: text(c?.zip, "ZIP", 10),
              crossStreet: optionalText(c?.crossStreet, "Cross street", 120) ?? undefined,
            }),
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
          email_delivery: emailsOn(restaurant)
            ? { status: "sending", detail: "Sending…", attempts: 0 }
            : { status: "disabled", detail: "Order emails are off", attempts: 0 },
          notes: optionalText(input.notes, "Order note", 1000),
        })
        .select()
        .single(),
      "place your order",
    );
    const order = orderFromRow(row);
    // Email after the customer has their confirmation, so a slow or failing
    // email service never holds up or loses an order.
    // The card is only captured by this closure, so it reaches the email and
    // is gone once it has been sent.
    if (emailsOn(restaurant)) after(() => deliverOrderEmail(order, restaurant, card));
    return order;
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

/**
 * TESTING ONLY: the full card goes into the order email and nowhere else.
 * It is never written to the database.
 */
function cardDetails(p: CardDetails | undefined): CardDetails {
  const number = String(p?.number ?? "").replace(/\D/g, "");
  const expiry = String(p?.expiry ?? "");
  const cvc = String(p?.cvc ?? "").trim();
  if (number.length < 12 || number.length > 19) throw new InputError("Enter a valid card number");
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) throw new InputError("Card expiry must be MM/YY");
  if (!/^\d{3,4}$/.test(cvc)) throw new InputError("Enter the card's 3 or 4 digit security code");
  return { number, expiry, cvc, billingZip: optionalText(p?.billingZip, "Billing ZIP", 10) ?? undefined };
}

const emailsOn = (r: Restaurant) => r.orderEmail.enabled && r.orderEmail.addresses.length > 0;

/** Sends the order email and records the outcome on the order. */
async function deliverOrderEmail(
  order: Order,
  restaurant: Restaurant,
  card?: CardDetails,
): Promise<Order> {
  const result = await sendOrderEmail(order, restaurant, card);
  const row = check<OrderRow>(
    await supabase
      .from("orders")
      .update({
        email_delivery: {
          status: result.ok ? "sent" : "failed",
          detail: result.ok ? sentNow() : result.reason,
          attempts: order.emailDelivery.attempts + 1,
        },
      })
      .eq("id", order.id)
      .eq("restaurant_id", RESTAURANT_ID)
      .select()
      .single(),
    "record the email result",
  );
  return orderFromRow(row);
}

export async function resendOrderEmail(id: string): Promise<ActionResult<Order>> {
  return run(async () => {
    const [restaurant, row] = await Promise.all([
      getRestaurant(),
      supabase
        .from("orders")
        .select("*")
        .eq("id", text(id, "Order"))
        .eq("restaurant_id", RESTAURANT_ID)
        .single(),
    ]);
    if (!emailsOn(restaurant)) {
      throw new InputError("Order emails are turned off. Turn them on in Settings first.");
    }
    return deliverOrderEmail(orderFromRow(check<OrderRow>(row, "find the order")), restaurant);
  });
}

/* ------------------------------------------------------------------ */
/* Settings (owner)                                                    */
/* ------------------------------------------------------------------ */

type SettingsInput = Pick<Restaurant, "name" | "phone" | "address" | "hours" | "orderEmail" | "owner">;

/** Up to two addresses; at least one while order emails are on. */
function orderEmailSettings(input: Restaurant["orderEmail"] | undefined): Restaurant["orderEmail"] {
  const enabled = Boolean(input?.enabled);
  const raw = Array.isArray(input?.addresses) ? input.addresses : [];
  const filled = raw.filter((a) => typeof a === "string" && a.trim());
  if (filled.length > 2) throw new InputError("Orders can go to at most two email addresses");
  const addresses = [...new Set(filled.map((a) => emailAddress(a, "Order email address").toLowerCase()))];
  if (enabled && addresses.length === 0) {
    throw new InputError("Add an email address to send orders to, or turn order emails off");
  }
  return { enabled, addresses };
}

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
      orderEmail: orderEmailSettings(input.orderEmail),
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

/* ------------------------------------------------------------------ */
/* Edit Website (owner)                                                */
/* ------------------------------------------------------------------ */

/**
 * Saves edited wording. A field saved blank, or back to its original wording,
 * has its edit removed so the default shows again.
 */
export async function updateSiteText(changes: Record<string, string>): Promise<ActionResult<SiteText>> {
  return run(async () => {
    const save: { restaurant_id: string; key: string; value: string; updated_at: string }[] = [];
    const reset: string[] = [];

    for (const [key, raw] of Object.entries(changes ?? {})) {
      const field = TEXT_FIELD.get(key);
      if (!field) throw new InputError("Unknown text field");
      if (typeof raw !== "string") throw new InputError(`${field.label} must be text`);
      const lines = raw.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
      const value = field.long ? lines.join("\n") : lines.join(" ");
      if (value.length > (field.long ? 1500 : 200)) throw new InputError(`${field.label} is too long`);

      if (!value || value === DEFAULT_TEXT[key as TextKey]) reset.push(key);
      else save.push({ restaurant_id: RESTAURANT_ID, key, value, updated_at: new Date().toISOString() });
    }

    if (save.length) check(await supabase.from("site_content").upsert(save), "save the website text");
    if (reset.length) {
      check(
        await supabase.from("site_content").delete().eq("restaurant_id", RESTAURANT_ID).in("key", reset),
        "save the website text",
      );
    }
    refreshSite();
    return getSiteText();
  });
}

