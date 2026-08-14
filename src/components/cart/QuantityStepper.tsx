"use client";

import { IconMinus, IconPlus } from "@/components/ui/icons";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  size = "md",
  ariaLabel = "Quantity",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  const btn =
    size === "sm"
      ? "h-8 w-8"
      : "h-11 w-11";
  const box = size === "sm" ? "min-w-8 text-sm" : "min-w-10 text-[0.9375rem]";

  return (
    <div
      className="inline-flex items-center rounded-xs border border-cream-300 bg-white"
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`${btn} flex items-center justify-center text-ink-700 transition-colors hover:bg-cream-100 disabled:opacity-30 disabled:hover:bg-transparent`}
      >
        <IconMinus className="h-4 w-4" />
      </button>
      <span className={`${box} text-center font-medium tabular-nums`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= 99}
        aria-label="Increase quantity"
        className={`${btn} flex items-center justify-center text-ink-700 transition-colors hover:bg-cream-100 disabled:opacity-30 disabled:hover:bg-transparent`}
      >
        <IconPlus className="h-4 w-4" />
      </button>
    </div>
  );
}
