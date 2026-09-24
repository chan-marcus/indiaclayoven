"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { CartLine, MenuItem } from "@/lib/types";
import { useRestaurantData } from "@/lib/restaurant-data";

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

type State = { lines: CartLine[] };

type Action =
  | { type: "add"; item: MenuItem; quantity: number; notes?: string }
  | { type: "setQuantity"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

const STORAGE_KEY = "ico.cart.v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines };

    case "add": {
      const notes = action.notes?.trim() || undefined;
      // Same dish + same notes merges into one line; different notes stay separate.
      const existing = state.lines.find(
        (l) => l.itemId === action.item.id && (l.notes ?? undefined) === notes,
      );
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.lineId === existing.lineId
              ? { ...l, quantity: Math.min(99, l.quantity + action.quantity) }
              : l,
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          {
            lineId: `${action.item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            itemId: action.item.id,
            name: action.item.name,
            price: action.item.price,
            image: action.item.image,
            quantity: action.quantity,
            notes,
          },
        ],
      };
    }

    case "setQuantity":
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((l) => l.lineId !== action.lineId) };
      }
      return {
        lines: state.lines.map((l) =>
          l.lineId === action.lineId ? { ...l, quantity: Math.min(99, action.quantity) } : l,
        ),
      };

    case "remove":
      return { lines: state.lines.filter((l) => l.lineId !== action.lineId) };

    case "clear":
      return { lines: [] };
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

interface CartValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  tax: number;
  total: (opts?: { delivery?: boolean }) => number;
  deliveryFee: number;
  taxRate: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Bumps whenever something is added. Drives the header cart nudge. */
  pulse: number;
  addItem: (item: MenuItem, quantity?: number, notes?: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  hydrated: boolean;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pulse, setPulse] = useState(0);
  const firstRun = useRef(true);

  // Restore the cart so a refresh mid-order doesn't lose it.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed });
      }
    } catch {
      /* ignore malformed storage */
    }
    // Restores the cart from localStorage, which cannot be read during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      /* storage may be unavailable */
    }
  }, [state.lines]);

  // Lock body scroll while the cart drawer is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const addItem = useCallback((item: MenuItem, quantity = 1, notes?: string) => {
    if (!item.available) return; // guard: sold-out items never enter the cart
    dispatch({ type: "add", item, quantity, notes });
    setPulse((p) => p + 1);
  }, []);

  const { settings, items } = useRestaurantData();

  // Price every line from the live menu, so a price change made in the
  // dashboard reaches carts already saved in the browser.
  const lines = useMemo(() => {
    const priceOf = new Map(items.map((i) => [i.id, i.price]));
    return state.lines.map((l) => ({ ...l, price: priceOf.get(l.itemId) ?? l.price }));
  }, [state.lines, items]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines]);
  const count = useMemo(
    () => state.lines.reduce((sum, l) => sum + l.quantity, 0),
    [state.lines],
  );
  // Rounded to the cent the same way the server does when the order is placed.
  const tax = useMemo(() => Math.round(subtotal * settings.taxRate * 100) / 100, [subtotal, settings.taxRate]);

  const total = useCallback(
    (opts?: { delivery?: boolean }) =>
      subtotal + tax + (opts?.delivery ? settings.deliveryFee : 0),
    [subtotal, tax, settings.deliveryFee],
  );

  const value: CartValue = {
    lines,
    count,
    subtotal,
    tax,
    total,
    deliveryFee: settings.deliveryFee,
    taxRate: settings.taxRate,
    isOpen,
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
    pulse,
    addItem,
    setQuantity: (lineId, quantity) => dispatch({ type: "setQuantity", lineId, quantity }),
    removeLine: (lineId) => dispatch({ type: "remove", lineId }),
    clear: () => dispatch({ type: "clear" }),
    hydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
