"use client";

import type { Order } from "@/lib/types";
import { useDashboard } from "@/lib/dashboard-data";
import { IconCheck, IconReceipt } from "@/components/ui/icons";

const TONE: Record<string, string> = {
  sent: "border-success/30 bg-success/8 text-success",
  sending: "border-gold/40 bg-gold-soft/40 text-[#7a5716]",
  failed: "border-danger/30 bg-danger/8 text-danger",
  disabled: "border-cream-300 bg-cream-100 text-ink-500",
};

const LABEL = {
  fax: { sent: "Faxed", sending: "Faxing…", failed: "Fax failed", disabled: "Fax off" },
  // Orders placed before faxing were emailed.
  email: { sent: "Emailed", sending: "Emailing…", failed: "Email failed", disabled: "Email off" },
} as const;

/** How the order's ticket reached the kitchen, with Resend fax if it failed. */
export function DeliveryStatus({ order, showRetry = true }: { order: Order; showRetry?: boolean }) {
  const { retryFax } = useDashboard();
  const { channel, status, detail } = order.delivery;
  // A fax still going shouldn't repeat "Faxing…" beside the label.
  const note = detail === LABEL[channel][status] ? "" : detail;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sm border px-3 py-2 ${TONE[status]}`}>
      <span className="inline-flex items-center gap-2 text-[0.8125rem] font-medium whitespace-nowrap">
        {status === "sent" ? <IconCheck className="h-4 w-4" /> : <IconReceipt className="h-4 w-4" />}
        {LABEL[channel][status]}
      </span>
      {note && <span className="text-[0.8125rem] opacity-80">{note}</span>}

      {showRetry && status === "failed" && (
        <button
          type="button"
          onClick={() => retryFax(order.id)}
          className="ml-auto rounded-xs border border-current px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-75"
        >
          Resend fax
        </button>
      )}
    </div>
  );
}
