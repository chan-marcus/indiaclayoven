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
import { getMenuItems, getOptionGroups, getOrders, getRestaurant, getSiteImages, getSiteText } from "@/lib/db";
import { DEFAULT_IMAGES, IMAGE_FIELD, isDefaultPhoto, type SiteImages, type SitePhoto } from "@/lib/site-images";
import { CENTER, isFocus } from "@/lib/photo-fit";
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
import { choicePrice, unitPrice } from "@/lib/pricing";
import { buildOrderTicket } from "@/lib/ticket";
import { failureText, faxConfigured, faxStatus, sendFax, ticketPdf } from "@/lib/fax/telnyx";
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
  "name" | "description" | "price" | "categoryId" | "available" | "optionGroupIds" | "choicePrices" | "imageFocus"
>;

type GroupRef = { id: string; name: string; options: string[]; sets_price: boolean };

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

/** Loads these option groups, checking they belong to this restaurant. Keeps the given order. */
async function ownGroups(value: unknown): Promise<GroupRef[]> {
  if (!Array.isArray(value)) throw new InputError("Invalid options");
  const ids = [...new Set(value.map((v) => text(v, "Option group", 100)))];
  if (ids.length === 0) return [];
  const found = check<GroupRef[]>(
    await supabase
      .from("option_groups")
      .select("id, name, options, sets_price")
      .eq("restaurant_id", RESTAURANT_ID)
      .in("id", ids),
    "check the options",
  );
  if (found.length !== ids.length) throw new InputError("One of those options was deleted. Reload and try again.");
  return ids.map((id) => found.find((g) => g.id === id)!);
}

/** A dish's price for every choice of a size option; all are required. */
function sizePrices(group: GroupRef, raw: unknown): number[] {
  const list = Array.isArray(raw) ? raw : [];
  return group.options.map((o, i) => {
    const v = list[i];
    if (v === undefined || v === null || v === "") throw new InputError(`Set a price for ${o}`);
    return money(v, `Price for ${o}`);
  });
}

/**
 * Replaces the option groups on one dish. A size option keeps the dish's
 * existing prices unless new ones are given. Returns the size prices in
 * force, so the dish price can follow the cheapest.
 */
async function replaceItemGroups(
  itemId: string,
  groups: GroupRef[],
  choicePrices?: Record<string, unknown>,
): Promise<number[] | null> {
  const sizes = groups.filter((g) => g.sets_price);
  if (sizes.length > 1) {
    throw new InputError(`A dish can have only one option that sets its price (${sizes.map((g) => g.name).join(", ")})`);
  }
  const existing = check<{ group_id: string; prices: number[] | null }[]>(
    await supabase.from("menu_item_option_groups").select("group_id, prices").eq("item_id", itemId),
    "save the dish's options",
  );
  const size = sizes[0];
  const given = size && choicePrices && size.id in choicePrices ? sizePrices(size, choicePrices[size.id]) : null;
  const kept = size ? (existing.find((r) => r.group_id === size.id)?.prices ?? null) : null;
  const sizeRow = given ?? (kept ? kept.map(Number) : null);

  check(
    await supabase.from("menu_item_option_groups").delete().eq("item_id", itemId),
    "save the dish's options",
  );
  if (groups.length) {
    check(
      await supabase.from("menu_item_option_groups").insert(
        groups.map((g) => ({ item_id: itemId, group_id: g.id, prices: g.sets_price ? sizeRow : null })),
      ),
      "save the dish's options",
    );
  }
  return sizeRow;
}

/** A dish with sizes is listed at its cheapest one. */
const cheapest = (prices: (number | null)[] | null) => {
  const set = (prices ?? []).filter((p): p is number => p !== null);
  return set.length ? Math.min(...set) : null;
};

export async function updateMenuItem(id: string, patch: Partial<ItemInput>): Promise<ActionResult<MenuItem>> {
  return run(async () => {
    const itemId = text(id, "Item");
    const update: Partial<MenuItemRow> = {};
    if ("name" in patch) update.name = text(patch.name, "Name", 120);
    if ("description" in patch) update.description = optionalText(patch.description, "Description");
    if ("price" in patch) update.price = money(patch.price, "Price");
    if ("categoryId" in patch) update.category_id = text(patch.categoryId, "Category");
    if ("available" in patch) update.available = Boolean(patch.available);
    if ("imageFocus" in patch) {
      if (patch.imageFocus !== undefined && patch.imageFocus !== null && !isFocus(patch.imageFocus)) {
        throw new InputError("Invalid photo framing");
      }
      update.image_focus = patch.imageFocus && patch.imageFocus !== CENTER ? patch.imageFocus : null;
    }
    const groups = "optionGroupIds" in patch ? await ownGroups(patch.optionGroupIds) : null;

    // Also confirms the dish belongs to this restaurant before its options change.
    const dish = supabase.from("menu_items");
    check(
      Object.keys(update).length
        ? await dish.update(update).eq("id", itemId).eq("restaurant_id", RESTAURANT_ID).select("id").single()
        : await dish.select("id").eq("id", itemId).eq("restaurant_id", RESTAURANT_ID).single(),
      "save the dish",
    );

    // New size prices with the options unchanged: re-save the current options.
    const attach =
      groups ??
      ("choicePrices" in patch ? await ownGroups((await loadItem(itemId)).optionGroupIds) : null);
    if (attach) {
      const low = cheapest(await replaceItemGroups(itemId, attach, patch.choicePrices));
      if (low !== null) {
        check(
          await supabase.from("menu_items").update({ price: low }).eq("id", itemId).eq("restaurant_id", RESTAURANT_ID),
          "save the dish",
        );
      }
    }
    refreshSite();
    return loadItem(itemId);
  });
}

export async function createMenuItem(
  input: Omit<ItemInput, "optionGroupIds" | "choicePrices" | "imageFocus"> & {
    imageFocus?: string;
    optionGroupIds?: string[];
    choicePrices?: MenuItem["choicePrices"];
    image?: string;
  },
): Promise<ActionResult<MenuItem>> {
  return run(async () => {
    const groups = await ownGroups(input.optionGroupIds ?? []);
    const size = groups.find((g) => g.sets_price);
    // With sizes, the dish is listed at its cheapest one.
    const price = size ? Math.min(...sizePrices(size, input.choicePrices?.[size.id])) : money(input.price, "Price");
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
          price,
          image: input.image?.startsWith("/images/") ? input.image : null,
          image_focus: isFocus(input.imageFocus) && input.imageFocus !== CENTER ? input.imageFocus : null,
          available: input.available ?? true,
          badges: [],
          signature: false,
          sort: (last[0]?.sort ?? 0) + 1,
        })
        .select()
        .single(),
      "add the dish",
    );
    await replaceItemGroups(row.id, groups, input.choicePrices);
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
      await supabase
        .from("menu_items")
        .update({ image: null, image_focus: null })
        .eq("id", itemId)
        .eq("restaurant_id", RESTAURANT_ID),
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

/**
 * `prices[i]` is what `options[i]` adds to the dish price; missing means 0.
 * With `setsPrice`, each dish sets its own price per choice instead.
 */
type GroupInput = { name: string; options: string[]; prices?: number[]; setsPrice?: boolean };

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
  const sets_price = Boolean(input.setsPrice);
  return { name, options, prices: sets_price ? options.map(() => 0) : prices, sets_price };
}

/** Dishes among `itemIds` that already have a different price-setting option. */
async function sizeConflicts(groupId: string, itemIds: string[]): Promise<string[]> {
  if (itemIds.length === 0) return [];
  const rows = check<{ menu_items: { name: string } }[]>(
    await supabase
      .from("menu_item_option_groups")
      .select("menu_items!inner(name), option_groups!inner(sets_price)")
      .in("item_id", itemIds)
      .neq("group_id", groupId)
      .eq("option_groups.sets_price", true),
    "check the dishes",
  );
  return rows.map((r) => r.menu_items.name);
}

const conflictMessage = (names: string[]) =>
  `${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""} already ${
    names.length === 1 ? "has" : "have"
  } an option that sets the price. A dish can have only one.`;

/**
 * Keeps each dish's size prices with the right choice after the choices are
 * edited: matched by name, or by position when a choice was renamed in place.
 */
function remapPrices(before: string[], after: string[], prices: (number | null)[]): (number | null)[] {
  return after.map((o, i) => {
    const j = before.indexOf(o);
    if (j !== -1) return prices[j] ?? null;
    if (i < before.length && !after.includes(before[i])) return prices[i] ?? null;
    return null;
  });
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
        .select("id, restaurant_id, name, options, prices, sets_price, sort")
        .single(),
      "add the option",
    );
    refreshSite();
    return optionGroupFromRow(row);
  });
}

export async function updateOptionGroup(id: string, input: GroupInput): Promise<ActionResult<OptionGroup>> {
  return run(async () => {
    const [before] = await ownGroups([id]);
    const fields = groupFields(input);
    const links = check<{ item_id: string; prices: (number | string | null)[] | null }[]>(
      await supabase.from("menu_item_option_groups").select("item_id, prices").eq("group_id", before.id),
      "save the option",
    );
    if (fields.sets_price && !before.sets_price) {
      const clash = await sizeConflicts(before.id, links.map((l) => l.item_id));
      if (clash.length) throw new InputError(conflictMessage(clash));
    }

    const row = check<OptionGroupRow>(
      await supabase
        .from("option_groups")
        .update(fields)
        .eq("id", before.id)
        .eq("restaurant_id", RESTAURANT_ID)
        .select("id, restaurant_id, name, options, prices, sets_price, sort")
        .single(),
      "save the option",
    );

    // Dishes' own prices follow their choices, and each dish stays listed
    // at its cheapest size.
    if (fields.sets_price) {
      for (const link of links) {
        if (!link.prices) continue;
        const prices = remapPrices(before.options, fields.options, link.prices.map((p) => (p === null ? null : Number(p))));
        check(
          await supabase
            .from("menu_item_option_groups")
            .update({ prices })
            .eq("item_id", link.item_id)
            .eq("group_id", before.id),
          "save the option",
        );
        const low = cheapest(prices);
        if (low !== null) {
          check(
            await supabase
              .from("menu_items")
              .update({ price: low })
              .eq("id", link.item_id)
              .eq("restaurant_id", RESTAURANT_ID),
            "save the option",
          );
        }
      }
    }
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
    const [group] = await ownGroups([groupId]);
    const gid = group.id;
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
      if (group.sets_price) {
        const clash = await sizeConflicts(gid, valid);
        if (clash.length) throw new InputError(conflictMessage(clash));
      }
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
  /** TESTING ONLY: faxed with the order, never stored. */
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
    return { groupId: g.id, group: g.name, choice, price: choicePrice(dish, g, choice) };
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
          delivery: faxOn(restaurant)
            ? { channel: "fax", status: "sending", detail: "Faxing…", attempts: 0 }
            : { channel: "fax", status: "disabled", detail: "Order faxing is off", attempts: 0 },
          notes: optionalText(input.notes, "Order note", 1000),
        })
        .select()
        .single(),
      "place your order",
    );
    const order = orderFromRow(row);
    // Fax after the customer has their confirmation, so a slow or failing
    // fax service never holds up or loses an order.
    // The card is only captured by this closure, so it reaches the fax and
    // is gone once it has been sent.
    if (faxOn(restaurant)) after(() => deliverOrderFax(order, restaurant, card));
    return order;
  });
}

export async function listOrders(): Promise<ActionResult<Order[]>> {
  return run(async () => {
    const orders = await getOrders();
    if (!(await syncFaxes(orders))) return orders;
    // getOrders is cached for this request; read again for the new statuses.
    const fresh = check<OrderRow[]>(
      await supabase.from("orders").select("*").eq("restaurant_id", RESTAURANT_ID).order("placed_at", { ascending: false }),
      "load orders",
    );
    return fresh.map(orderFromRow);
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
 * TESTING ONLY: the full card goes onto the order fax and nowhere else.
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

const faxOn = (r: Restaurant) => r.orderFax.enabled && r.orderFax.numbers.length > 0;

const faxedAt = () =>
  `Faxed ${new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: RESTAURANT_TIME_ZONE,
  })}`;

async function saveDelivery(order: Order, delivery: Order["delivery"]): Promise<Order> {
  const row = check<OrderRow>(
    await supabase
      .from("orders")
      .update({ delivery })
      .eq("id", order.id)
      .eq("restaurant_id", RESTAURANT_ID)
      .select()
      .single(),
    "record the fax result",
  );
  return orderFromRow(row);
}

/**
 * Faxes the order ticket to each number in Settings and records what Telnyx
 * said. Delivery takes a minute or two; listOrders checks on it.
 */
async function deliverOrderFax(order: Order, restaurant: Restaurant, card?: CardDetails): Promise<Order> {
  const attempts = order.delivery.attempts + 1;
  if (!faxConfigured()) {
    return saveDelivery(order, { channel: "fax", status: "failed", detail: "Fax service not set up", attempts });
  }
  const pdf = await ticketPdf(buildOrderTicket(order, card), `Order ${order.number}`);
  const results = await Promise.all(restaurant.orderFax.numbers.map((to) => sendFax(pdf, to).then((r) => ({ to, r }))));
  const faxes = results.flatMap(({ to, r }) => (r.ok ? [{ id: r.id, to, status: r.status }] : []));
  const refused = results.find(({ r }) => !r.ok);

  if (faxes.length === 0) {
    const reason = refused && !refused.r.ok ? refused.r.reason : "The fax didn't go through";
    return saveDelivery(order, { channel: "fax", status: "failed", detail: reason, attempts });
  }
  return saveDelivery(order, {
    channel: "fax",
    status: "sending",
    detail: refused ? `Faxing… (one number refused)` : "Faxing…",
    attempts,
    faxes,
  });
}

/**
 * Asks Telnyx how recent faxes are doing and records it: Faxed once every
 * fax is delivered, Failed (with the reason) if one fails.
 */
async function syncFaxes(orders: Order[]): Promise<boolean> {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const pending = orders
    .filter((o) => o.delivery.channel === "fax" && o.delivery.status === "sending" && o.delivery.faxes?.length)
    .filter((o) => new Date(o.placedAt).getTime() > dayAgo)
    .slice(0, 10);
  let changed = false;
  for (const order of pending) {
    const faxes = await Promise.all(
      order.delivery.faxes!.map(async (f) => {
        if (f.status === "delivered" || f.status === "failed") return f;
        const now = await faxStatus(f.id);
        return now ? { ...f, status: now.status, failureReason: now.failureReason } : f;
      }),
    );
    const failed = faxes.find((f) => f.status === "failed");
    const done = faxes.every((f) => f.status === "delivered");
    const next: Order["delivery"] = failed
      ? { ...order.delivery, faxes, status: "failed", detail: failureText(failed.failureReason) }
      : done
        ? { ...order.delivery, faxes, status: "sent", detail: faxedAt() }
        : { ...order.delivery, faxes };
    if (JSON.stringify(next) !== JSON.stringify(order.delivery)) {
      await saveDelivery(order, next);
      changed = true;
    }
  }
  return changed;
}

export async function resendOrderFax(id: string): Promise<ActionResult<Order>> {
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
    if (!faxOn(restaurant)) {
      throw new InputError("Order faxing is turned off. Turn it on in Settings first.");
    }
    const order = orderFromRow(check<OrderRow>(row, "find the order"));
    return deliverOrderFax({ ...order, delivery: { ...order.delivery, channel: "fax" } }, restaurant);
  });
}

/* ------------------------------------------------------------------ */
/* Settings (owner)                                                    */
/* ------------------------------------------------------------------ */

type SettingsInput = Pick<Restaurant, "name" | "phone" | "address" | "hours" | "orderFax" | "owner">;

/** A fax number as E.164: US numbers can be typed any usual way, others need +. */
function faxNumber(value: unknown): string {
  const raw = text(value, "Fax number", 30);
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) {
    if (digits.length < 8 || digits.length > 15) throw new InputError(`${raw} isn't a valid fax number`);
    return `+${digits}`;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  throw new InputError(`${raw} isn't a valid fax number. Use 10 digits, like 415 555 0100.`);
}

/** Up to two fax numbers; at least one while faxing is on. */
function orderFaxSettings(input: Restaurant["orderFax"] | undefined): Restaurant["orderFax"] {
  const enabled = Boolean(input?.enabled);
  const raw = Array.isArray(input?.numbers) ? input.numbers : [];
  const filled = raw.filter((n) => typeof n === "string" && n.trim());
  if (filled.length > 2) throw new InputError("Orders can go to at most two fax numbers");
  const numbers = [...new Set(filled.map(faxNumber))];
  if (enabled && numbers.length === 0) {
    throw new InputError("Add a fax number to send orders to, or turn order faxing off");
  }
  return { enabled, numbers };
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
      orderFax: orderFaxSettings(input.orderFax),
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


/* ------------------------------------------------------------------ */
/* Website photos (owner)                                              */
/* ------------------------------------------------------------------ */

/** Where a website photo's uploads live in the bucket. */
const siteImageFolder = (key: string) => `${RESTAURANT_ID}/site/${key}/`;

/** Reads an uploaded photo, refusing anything that isn't a real image. */
async function readPhoto(form: FormData) {
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) throw new InputError("Choose a photo to upload");
  if (file.size > MAX_IMAGE_BYTES) throw new InputError("That photo is too large. Use one under 4 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) throw new InputError("Use a JPG, PNG or WebP photo");
  return { bytes, type };
}

/**
 * Uploads a replacement for one website photo and returns its address.
 * Nothing changes on the website until it's saved with updateSiteImages.
 */
export async function uploadSiteImage(key: string, form: FormData): Promise<ActionResult<string>> {
  return run(async () => {
    if (!IMAGE_FIELD.has(key)) throw new InputError("Unknown photo");
    const { bytes, type } = await readPhoto(form);
    const path = `${siteImageFolder(key)}${crypto.randomUUID()}.${type.ext}`;
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, bytes, { contentType: type.mime, cacheControl: "31536000", upsert: false });
    if (error) throw new Error(`Could not upload the photo: ${error.message}`);
    return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  });
}

/**
 * Saves replaced or reframed website photos. A photo back to its original,
 * centred, has its row removed. Uploads that are no longer used are deleted.
 */
export async function updateSiteImages(changes: Record<string, SitePhoto>): Promise<ActionResult<SiteImages>> {
  return run(async () => {
    const save: { restaurant_id: string; key: string; url: string; focus: string | null; updated_at: string }[] = [];
    const reset: string[] = [];
    for (const [key, photo] of Object.entries(changes ?? {})) {
      if (!IMAGE_FIELD.has(key)) throw new InputError("Unknown photo");
      const url = photo?.src;
      if (typeof url !== "string" || !url) throw new InputError("Invalid photo");
      if (photo.focus !== undefined && !isFocus(photo.focus)) throw new InputError("Invalid photo framing");
      if (isDefaultPhoto(key, photo)) {
        reset.push(key);
        continue;
      }
      // The original photo (reframed), or one uploaded for this spot.
      const ownUpload = uploadedPath(url)?.startsWith(siteImageFolder(key)) === true;
      if (url !== DEFAULT_IMAGES[key].src && !ownUpload) throw new InputError("Invalid photo");
      save.push({
        restaurant_id: RESTAURANT_ID,
        key,
        url,
        focus: photo.focus && photo.focus !== CENTER ? photo.focus : null,
        updated_at: new Date().toISOString(),
      });
    }

    if (save.length) check(await supabase.from("site_images").upsert(save), "save the photos");
    if (reset.length) {
      check(
        await supabase.from("site_images").delete().eq("restaurant_id", RESTAURANT_ID).in("key", reset),
        "save the photos",
      );
    }

    // Tidy up: any upload that isn't a photo in use now, including ones
    // uploaded and then discarded before saving.
    const current = await getSiteImages();
    const { data: folders } = await supabase.storage.from(IMAGE_BUCKET).list(`${RESTAURANT_ID}/site`, { limit: 100 });
    for (const { name: key } of folders ?? []) {
      const folder = siteImageFolder(key);
      const { data } = await supabase.storage.from(IMAGE_BUCKET).list(folder.slice(0, -1), { limit: 100 });
      const keep = current[key] ? uploadedPath(current[key].src) : null;
      const stale = (data ?? []).map((f) => `${folder}${f.name}`).filter((p) => p !== keep);
      if (stale.length) await supabase.storage.from(IMAGE_BUCKET).remove(stale);
    }

    refreshSite();
    return current;
  });
}
