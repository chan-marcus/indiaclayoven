"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Category, MenuItem, Order, OrderStatus, Restaurant } from "@/lib/types";
import { seedOrders } from "@/lib/data/orders";
import { categories as seedCategories, menuItems as seedItems } from "@/lib/data/menu";
import { restaurant as seedRestaurant } from "@/lib/data/restaurant";

/**
 * One store behind both the customer website and the owner dashboard.
 *
 * This is what makes the prototype demonstrable: mark a dish sold out in the
 * dashboard and it is sold out on the menu; place an order on the site and it
 * lands on the owner's Orders screen. A production build would swap this for
 * the API layer. The component contracts would not change.
 *
 * Seed data renders on the server; anything the owner changed is restored from
 * localStorage after hydration.
 */

const STORAGE_KEY = "ico.data.v2";

interface DataValue {
  items: MenuItem[];
  categories: Category[];
  orders: Order[];
  settings: Restaurant;

  // Menu management
  toggleAvailability: (id: string) => void;
  updateItem: (id: string, patch: Partial<MenuItem>) => void;
  addItem: (item: Omit<MenuItem, "id" | "restaurantId" | "sort">) => void;
  deleteItem: (id: string) => void;
  addCategory: (name: string) => void;

  // Orders
  addOrder: (order: Order) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  retryEmail: (id: string) => void;

  // Settings
  updateSettings: (patch: Partial<Restaurant>) => void;

  /** Reset the prototype to its seeded state. */
  resetAll: () => void;
}

const Ctx = createContext<DataValue | null>(null);

type Persisted = {
  items: MenuItem[];
  categories: Category[];
  orders: Order[];
  settings: Restaurant;
};

export function RestaurantDataProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MenuItem[]>(seedItems);
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [settings, setSettings] = useState<Restaurant>(seedRestaurant);
  // Must be state, not a ref: the persist effect below has to wait for the
  // *render* that carries the restored data, otherwise it writes the seed
  // straight back over what the owner saved.
  const [hydrated, setHydrated] = useState(false);

  // Restore after hydration so server and first client render agree.
  useEffect(() => {
    try {
      /* eslint-disable react-hooks/set-state-in-effect -- restoring the owner's
         saved data from localStorage, which cannot be read during SSR. */
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        if (p.items?.length) setItems(p.items);
        if (p.categories?.length) setCategories(p.categories);
        if (p.orders?.length) setOrders(p.orders);
        if (p.settings) setSettings(p.settings);
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, categories, orders, settings }),
      );
    } catch {
      /* storage may be unavailable */
    }
  }, [hydrated, items, categories, orders, settings]);

  const retryEmail = useCallback((id: string) => {
    setOrders((o) =>
      o.map((x) =>
        x.id === id
          ? {
              ...x,
              emailDelivery: {
                status: "sending",
                detail: "Sending…",
                attempts: x.emailDelivery.attempts + 1,
              },
            }
          : x,
      ),
    );
    // Simulated send.
    window.setTimeout(() => {
      setOrders((o) =>
        o.map((x) =>
          x.id === id
            ? {
                ...x,
                emailDelivery: {
                  status: "sent",
                  detail: `Sent ${new Date().toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`,
                  attempts: x.emailDelivery.attempts,
                },
              }
            : x,
        ),
      );
    }, 2200);
  }, []);

  const value = useMemo<DataValue>(
    () => ({
      items,
      categories,
      orders,
      settings,

      toggleAvailability: (id) =>
        setItems((s) => s.map((i) => (i.id === id ? { ...i, available: !i.available } : i))),
      updateItem: (id, patch) =>
        setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i))),
      addItem: (item) =>
        setItems((s) => [
          ...s,
          { ...item, id: `itm_new_${Date.now()}`, restaurantId: settings.id, sort: s.length + 1 },
        ]),
      deleteItem: (id) => setItems((s) => s.filter((i) => i.id !== id)),
      addCategory: (name) =>
        setCategories((c) => [
          ...c,
          { id: `cat_new_${Date.now()}`, restaurantId: settings.id, name, sort: c.length + 1 },
        ]),

      addOrder: (order) => setOrders((o) => [order, ...o]),
      setOrderStatus: (id, status) =>
        setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x))),
      retryEmail,

      updateSettings: (patch) => setSettings((s) => ({ ...s, ...patch })),

      resetAll: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setItems(seedItems);
        setCategories(seedCategories);
        setOrders(seedOrders);
        setSettings(seedRestaurant);
      },
    }),
    [items, categories, orders, settings, retryEmail],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRestaurantData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRestaurantData must be used inside <RestaurantDataProvider>");
  return v;
}

/** Kept so dashboard screens read naturally. */
export const useDashboard = useRestaurantData;
