"use client";

import type { Delivery, Order } from "@/lib/types";
import { useDashboard } from "@/lib/dashboard-data";
import { IconCheck, IconMail, IconReceipt } from "@/components/ui/icons";

const TONE: Record<string, string> = {
  sent: "border-success/30 bg-success/8 text-success",
  sending: "border-gold/40 bg-gold-soft/40 text-[#7a5716]",
  failed: "border-danger/30 bg-danger/8 text-danger",
  disabled: "border-cream-300 bg-cream-100 text-ink-500",
};

const LABEL = {
  fax: { sent: "Faxed", sending: "Faxing…", failed: "Fax failed", disabled: "Not faxed" },
  email: { sent: "Emailed", sending: "Sending…", failed: "Email failed", disabled: "Not emailed" },
} as const;

/**
 * How the order's fax or email to the kitchen went, with a button to resend
 * one that failed (or send one that never went, while that's turned on).
 */
export function DeliveryStatus({
  order,
  kind,
  showRetry = true,
}: {
  order: Order;
  kind: "fax" | "email";
  showRetry?: boolean;
}) {
  const { retryFax, retryEmail, settings } = useDashboard();
  const d: Delivery = (kind === "fax" ? order.delivery : order.emailDelivery) ?? {
    status: "disabled",
    detail: "",
    attempts: 0,
  };
  const label = LABEL[kind][d.status];
  // "Faxing…" beside "Faxing…" says nothing new.
  const note = d.detail === label ? "" : d.detail;
  const on = kind === "fax" ? settings.orderFax.enabled : settings.orderEmail.enabled;
  const noun = kind === "fax" ? "fax" : "email";
  const action = d.status === "failed" ? `Resend ${noun}` : d.status === "disabled" && on ? `Send ${noun}` : null;
  const Icon = d.status === "sent" ? IconCheck : kind === "fax" ? IconReceipt : IconMail;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sm border px-3 py-2 ${TONE[d.status]}`}>
      <span className="inline-flex items-center gap-2 text-[0.8125rem] font-medium whitespace-nowrap">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {note && <span className="text-[0.8125rem] opacity-80">{note}</span>}

      {showRetry && action && (
        <button
          type="button"
          onClick={() => (kind === "fax" ? retryFax : retryEmail)(order.id)}
          className="ml-auto rounded-xs border border-current px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-75"
        >
          {action}
        </button>
      )}
    </div>
  );
}
