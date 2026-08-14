import type { Order } from "@/lib/types";

/**
 * The placed order is handed from checkout to the confirmation page through
 * sessionStorage. A real build would POST the order and redirect to
 * /order/<id> — this keeps the flow identical without a backend.
 */
const KEY = "ico.lastOrder.v1";
const COUNTER_KEY = "ico.orderNumber.v1";

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

/** Order numbers continue from the seeded dashboard data. */
export function nextOrderNumber(): number {
  try {
    const current = Number(window.localStorage.getItem(COUNTER_KEY) ?? "1048");
    const next = current + 1;
    window.localStorage.setItem(COUNTER_KEY, String(next));
    return next;
  } catch {
    return 1049;
  }
}
