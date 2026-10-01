import "server-only";
import { cache } from "react";
import { supabase } from "@/lib/supabase/server";
import { RESTAURANT_ID } from "@/lib/restaurant";
import {
  categoryFromRow,
  menuItemFromRow,
  orderFromRow,
  restaurantFromRow,
  type CategoryRow,
  type MenuItemRow,
  type OrderRow,
  type RestaurantRow,
} from "@/lib/db-rows";
import { mergeText } from "@/lib/site-text";

type Result = { data: unknown; error: { message: string } | null };

function rows<T>(res: Result, what: string): T {
  if (res.error) throw new Error(`Supabase: could not load ${what}: ${res.error.message}`);
  if (res.data === null) throw new Error(`Supabase: ${what} not found`);
  return res.data as T;
}

export const getRestaurant = cache(async () => {
  const res = await supabase.from("restaurants").select("*").eq("id", RESTAURANT_ID).single();
  return restaurantFromRow(rows<RestaurantRow>(res, "restaurant"));
});

export const getCategories = cache(async () => {
  const res = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", RESTAURANT_ID)
    .order("sort");
  return rows<CategoryRow[]>(res, "categories").map(categoryFromRow);
});

export const getMenuItems = cache(async () => {
  const res = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", RESTAURANT_ID)
    .order("sort");
  return rows<MenuItemRow[]>(res, "menu items").map(menuItemFromRow);
});

/** Contains customer contact details. Only ever load this for the owner dashboard. */
export const getOrders = cache(async () => {
  const res = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", RESTAURANT_ID)
    .order("placed_at", { ascending: false });
  return rows<OrderRow[]>(res, "orders").map(orderFromRow);
});

/** Website wording: defaults with the owner's edits from Dashboard → Website text. */
export const getSiteText = cache(async () => {
  const res = await supabase.from("site_content").select("key, value").eq("restaurant_id", RESTAURANT_ID);
  const saved = rows<{ key: string; value: string }[]>(res, "website text");
  return mergeText(Object.fromEntries(saved.map((r) => [r.key, r.value])));
});
