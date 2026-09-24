"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { listOrders, resendOrderEmail, setOrderStatus } from "@/app/actions";
import { reportFailure, useRestaurantData } from "@/lib/restaurant-data";
import { unwrap } from "@/lib/action-result";

/** How often the dashboard checks for orders placed from other devices. */
const POLL_MS = 15_000;

interface OrdersValue {
  orders: Order[];
  setOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  retryEmail: (id: string) => Promise<void>;
}

const Ctx = createContext<OrdersValue | null>(null);

export function DashboardDataProvider({
  initialOrders,
  children,
}: {
  initialOrders: Order[];
  children: React.ReactNode;
}) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      // On failure keep showing what we have; the next poll retries.
      listOrders().then((r) => r.ok && setOrders(r.data), () => {});
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  const replace = (order: Order) => setOrders((o) => o.map((x) => (x.id === order.id ? order : x)));

  const value: OrdersValue = {
    orders,

    setOrderStatus: async (id, status) => {
      const before = orders.find((o) => o.id === id);
      if (!before) return;
      replace({ ...before, status });
      try {
        unwrap(await setOrderStatus(id, status));
      } catch (err) {
        replace(before);
        reportFailure("update that order", err);
      }
    },

    retryEmail: async (id) => {
      const before = orders.find((o) => o.id === id);
      if (!before) return;
      replace({ ...before, emailDelivery: { ...before.emailDelivery, status: "sending", detail: "Sending…" } });
      try {
        replace(unwrap(await resendOrderEmail(id)));
      } catch (err) {
        replace(before);
        reportFailure("resend that email", err);
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Everything the owner dashboard needs: public data plus orders. */
export function useDashboard() {
  const orders = useContext(Ctx);
  if (!orders) throw new Error("useDashboard must be used inside <DashboardDataProvider>");
  return { ...useRestaurantData(), ...orders };
}
