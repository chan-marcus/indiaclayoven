"use client";

import { createContext, useContext, useState } from "react";
import type { Category, MenuItem, Restaurant } from "@/lib/types";
import {
  createCategory,
  createMenuItem,
  deleteMenuItem,
  setItemAvailability,
  updateMenuItem,
  updateRestaurant,
} from "@/app/actions";
import { unwrap } from "@/lib/action-result";

/**
 * The restaurant's public data (settings, categories, menu), shared by the
 * customer site and the owner dashboard.
 *
 * Loaded from Supabase by the root layout on every request and handed in as
 * `initial`. Owner edits are saved through server actions and applied here
 * straight away, so the dashboard and the menu stay in step.
 *
 * Orders are deliberately not here: they hold customer contact details, so
 * they only load inside the dashboard (see dashboard-data.tsx).
 */

export type PublicData = {
  settings: Restaurant;
  categories: Category[];
  items: MenuItem[];
};

type ItemInput = Pick<MenuItem, "name" | "description" | "price" | "categoryId" | "available">;
type SettingsInput = Parameters<typeof updateRestaurant>[0];

interface DataValue extends PublicData {
  toggleAvailability: (id: string) => Promise<void>;
  updateItem: (id: string, patch: Partial<ItemInput>) => Promise<void>;
  addItem: (item: ItemInput & { image?: string }) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateSettings: (input: SettingsInput) => Promise<void>;
}

const Ctx = createContext<DataValue | null>(null);

/** Tells the owner a save failed, with the reason from the server. */
export function reportFailure(action: string, err: unknown) {
  const detail = err instanceof Error ? err.message : String(err);
  window.alert(`Sorry, we could not ${action}.\n\n${detail}`);
}

export function RestaurantDataProvider({
  initial,
  children,
}: {
  initial: PublicData;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState(initial.settings);
  const [categories, setCategories] = useState(initial.categories);
  const [items, setItems] = useState(initial.items);

  // A server refresh (after any save) hands in fresh data; adopt it.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setSettings(initial.settings);
    setCategories(initial.categories);
    setItems(initial.items);
  }

  const replaceItem = (item: MenuItem) =>
    setItems((s) => s.map((i) => (i.id === item.id ? item : i)));

  const value: DataValue = {
    settings,
    categories,
    items,

    toggleAvailability: async (id) => {
      const before = items.find((i) => i.id === id);
      if (!before) return;
      replaceItem({ ...before, available: !before.available });
      try {
        unwrap(await setItemAvailability(id, !before.available));
      } catch (err) {
        replaceItem(before);
        reportFailure("update that dish", err);
      }
    },

    updateItem: async (id, patch) => {
      try {
        replaceItem(unwrap(await updateMenuItem(id, patch)));
      } catch (err) {
        reportFailure("save that dish", err);
      }
    },

    addItem: async (input) => {
      try {
        const created = unwrap(await createMenuItem(input));
        setItems((s) => [...s, created]);
      } catch (err) {
        reportFailure("add that dish", err);
      }
    },

    deleteItem: async (id) => {
      const before = items;
      setItems((s) => s.filter((i) => i.id !== id));
      try {
        unwrap(await deleteMenuItem(id));
      } catch (err) {
        setItems(before);
        reportFailure("remove that dish", err);
      }
    },

    addCategory: async (name) => {
      try {
        const created = unwrap(await createCategory(name));
        setCategories((c) => [...c, created]);
      } catch (err) {
        reportFailure("add that category", err);
      }
    },

    updateSettings: async (input) => {
      // Rethrown so the settings form can tell the owner it did not save.
      setSettings(unwrap(await updateRestaurant(input)));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRestaurantData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRestaurantData must be used inside <RestaurantDataProvider>");
  return v;
}
