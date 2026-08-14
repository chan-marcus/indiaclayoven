"use client";

import type { Order } from "@/lib/types";
import { useDashboard } from "@/lib/restaurant-data";
import { IconCheck, IconFax } from "@/components/ui/icons";

const TONE: Record<string, string> = {
  sent: "border-success/30 bg-success/8 text-success",
  sending: "border-gold/40 bg-gold-soft/40 text-[#7a5716]",
  failed: "border-danger/30 bg-danger/8 text-danger",
  disabled: "border-cream-300 bg-cream-100 text-ink-500",
};

const LABEL: Record<string, string> = {
  sent: "Fax sent",
  sending: "Sending…",
  failed: "Fax failed",
  disabled: "Fax off",
};

export function FaxStatus({ order, showRetry = true }: { order: Order; showRetry?: boolean }) {
  const { retryFax } = useDashboard();
  const s = order.fax.status;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sm border px-3 py-2 ${TONE[s]}`}
    >
      <span className="inline-flex items-center gap-2 text-[0.8125rem] font-medium">
        {s === "sent" ? <IconCheck className="h-4 w-4" /> : <IconFax className="h-4 w-4" />}
        {LABEL[s]}
      </span>
      <span className="text-[0.8125rem] opacity-80">{order.fax.detail}</span>

      {showRetry && s === "failed" && (
        <button
          type="button"
          onClick={() => retryFax(order.id)}
          className="ml-auto rounded-xs border border-current px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-75"
        >
          Retry Fax
        </button>
      )}
    </div>
  );
}
