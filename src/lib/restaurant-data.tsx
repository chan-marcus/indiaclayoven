"use client";

import { createContext, useContext, useState } from "react";
import type { Category, MenuItem, OptionGroup, Restaurant } from "@/lib/types";
import type { SiteText } from "@/lib/site-text";
import {
  createCategory,
  createMenuItem,
  createOptionGroup,
  deleteMenuItem,
  deleteOptionGroup,
  setItemAvailability,
  setOptionGroupOnItems,
  updateOptionGroup,
  updateMenuItem,
  updateRestaurant,
  updateSiteText,
  removeMenuItemImage,
  uploadMenuItemImage,
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
  /** Reusable choices (e.g. spice level) that dishes point to. */
  optionGroups: OptionGroup[];
  /** Website wording, with the owner's edits. */
  text: SiteText;
};

type ItemInput = Pick<
  MenuItem,
  "name" | "description" | "price" | "categoryId" | "available" | "optionGroupIds"
>;
type GroupInput = Pick<OptionGroup, "name" | "options">;
type SettingsInput = Parameters<typeof updateRestaurant>[0];

interface DataValue extends PublicData {
  toggleAvailability: (id: string) => Promise<void>;
  updateItem: (id: string, patch: Partial<ItemInput>) => Promise<void>;
  /** Resolves to the new dish, or undefined if it could not be added. */
  addItem: (item: ItemInput & { image?: string }) => Promise<MenuItem | undefined>;
  /** Uploads a new photo for the dish. */
  uploadItemImage: (id: string, photo: Blob) => Promise<void>;
  /** Leaves the dish without a photo. */
  removeItemImage: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  /** The option-group writes reject with the reason so the form can show it. */
  addOptionGroup: (input: GroupInput) => Promise<OptionGroup>;
  updateOptionGroup: (id: string, input: GroupInput) => Promise<void>;
  deleteOptionGroup: (id: string) => Promise<void>;
  /** Adds the group to (or removes it from) each listed dish. */
  setOptionGroupOnItems: (groupId: string, itemIds: string[], attached: boolean) => Promise<void>;
  updateSettings: (input: SettingsInput) => Promise<void>;
  /** Rejects with the reason if the save fails. */
  updateText: (changes: Record<string, string>) => Promise<void>;
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
  const [optionGroups, setOptionGroups] = useState(initial.optionGroups);
  const [text, setText] = useState(initial.text);

  // A server refresh (after any save) hands in fresh data; adopt it.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setSettings(initial.settings);
    setCategories(initial.categories);
    setItems(initial.items);
    setOptionGroups(initial.optionGroups);
    setText(initial.text);
  }

  const replaceItem = (item: MenuItem) =>
    setItems((s) => s.map((i) => (i.id === item.id ? item : i)));

  const value: DataValue = {
    settings,
    categories,
    items,
    optionGroups,
    text,

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
        return created;
      } catch (err) {
        reportFailure("add that dish", err);
      }
    },

    uploadItemImage: async (id, photo) => {
      const form = new FormData();
      form.append("photo", photo, "photo");
      try {
        replaceItem(unwrap(await uploadMenuItemImage(id, form)));
      } catch (err) {
        reportFailure("upload that photo", err);
      }
    },

    removeItemImage: async (id) => {
      try {
        replaceItem(unwrap(await removeMenuItemImage(id)));
      } catch (err) {
        reportFailure("remove that photo", err);
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

    addOptionGroup: async (input) => {
      const created = unwrap(await createOptionGroup(input));
      setOptionGroups((g) => [...g, created]);
      return created;
    },

    updateOptionGroup: async (id, input) => {
      const saved = unwrap(await updateOptionGroup(id, input));
      setOptionGroups((g) => g.map((x) => (x.id === id ? saved : x)));
    },

    deleteOptionGroup: async (id) => {
      unwrap(await deleteOptionGroup(id));
      setOptionGroups((g) => g.filter((x) => x.id !== id));
      setItems((s) =>
        s.map((i) => ({ ...i, optionGroupIds: i.optionGroupIds.filter((g) => g !== id) })),
      );
    },

    setOptionGroupOnItems: async (groupId, itemIds, attached) => {
      unwrap(await setOptionGroupOnItems(groupId, itemIds, attached));
      const ids = new Set(itemIds);
      setItems((s) =>
        s.map((i) => {
          if (!ids.has(i.id)) return i;
          const rest = i.optionGroupIds.filter((g) => g !== groupId);
          return { ...i, optionGroupIds: attached ? [...rest, groupId] : rest };
        }),
      );
    },

    updateSettings: async (input) => {
      // Rethrown so the settings form can tell the owner it did not save.
      setSettings(unwrap(await updateRestaurant(input)));
    },

    updateText: async (changes) => {
      setText(unwrap(await updateSiteText(changes)));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRestaurantData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRestaurantData must be used inside <RestaurantDataProvider>");
  return v;
}
