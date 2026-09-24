import type { Order } from "@/lib/types";

/**
 * The saved order is handed from checkout to the confirmation page through
 * sessionStorage, so the confirmation URL never exposes an order to others.
 */
const KEY = "ico.lastOrder.v1";

export function saveOrder(order: Order) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    /* storage unavailable */
  }
}

export function loadOrder(): Order | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}
