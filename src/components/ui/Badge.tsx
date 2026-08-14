import type { BadgeKind } from "@/lib/types";

const STYLES: Record<BadgeKind, { label: string; className: string }> = {
  signature: { label: "Signature", className: "bg-gold-soft text-[#7a5716] border-[#dcc9a0]" },
  popular: { label: "Popular", className: "bg-cream-100 text-ink-700 border-cream-300" },
  vegetarian: { label: "Vegetarian", className: "bg-[#eef1e8] text-[#4a6141] border-[#d3dcc9]" },
  spicy: { label: "Spicy", className: "bg-[#f8ebe7] text-[#9d3d2a] border-[#eccfc7]" },
  new: { label: "New", className: "bg-cream-100 text-ink-700 border-cream-300" },
};

export function Badge({ kind }: { kind: BadgeKind }) {
  const s = STYLES[kind];
  return (
    <span
      className={`inline-flex items-center rounded-xs border px-1.5 py-0.5 text-[0.625rem] font-medium tracking-[0.09em] uppercase ${s.className}`}
    >
      {s.label}
    </span>
  );
}

/** Used on dark surfaces (hero, dish overlays). */
export function BadgeOnDark({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-xs border border-gold-bright/45 bg-clay-dark/65 px-2 py-0.5 text-[0.625rem] font-medium tracking-[0.12em] text-gold-bright uppercase backdrop-blur-sm">
      {children}
    </span>
  );
}

export function SoldOutTag() {
  return (
    <span className="inline-flex items-center rounded-xs border border-ink-400/40 bg-ink/5 px-1.5 py-0.5 text-[0.625rem] font-medium tracking-[0.09em] text-ink-500 uppercase">
      Sold Out
    </span>
  );
}
