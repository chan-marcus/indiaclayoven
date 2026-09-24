/**
 * Loads the starting data (restaurant, categories, menu, demo orders) into
 * Supabase. Run once after creating the tables:
 *
 *   npm run db:seed
 *
 * It refuses to run if the restaurant already exists, so it can't overwrite
 * the owner's edits. Pass --force to overwrite anyway.
 */
import { createClient } from "@supabase/supabase-js";
import { seedRestaurant } from "@/lib/seed/restaurant";
import { seedCategories, seedMenuItems } from "@/lib/seed/menu";
import { seedOrders } from "@/lib/seed/orders";
import { categoryToRow, menuItemToRow, orderToRow, restaurantToRow } from "@/lib/db-rows";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");

const db = createClient(url, secret, { auth: { persistSession: false } });

async function step(label: string, run: () => PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await run();
  if (error) throw new Error(`${label}: ${error.message}`);
  console.log(`✓ ${label}`);
}

async function main() {
  const existing = await db.from("restaurants").select("id").eq("id", seedRestaurant.id);
  if (existing.error) throw new Error(`Could not reach the restaurants table: ${existing.error.message}`);
  if (existing.data.length && !process.argv.includes("--force")) {
    console.log("Already seeded; nothing changed. Use --force to overwrite with the seed data.");
    return;
  }

  await step("restaurant", () => db.from("restaurants").upsert(restaurantToRow(seedRestaurant)));
  await step(`${seedCategories.length} categories`, () =>
    db.from("categories").upsert(seedCategories.map(categoryToRow)),
  );
  await step(`${seedMenuItems.length} menu items`, () =>
    db.from("menu_items").upsert(seedMenuItems.map(menuItemToRow)),
  );
  await step(`${seedOrders.length} demo orders`, () => db.from("orders").upsert(seedOrders.map(orderToRow)));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
