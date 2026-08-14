import Link from "next/link";
import { restaurant } from "@/lib/data/restaurant";
import { OvenMark } from "./OvenMark";

/**
 * The clay oven mark set beside a serif wordmark. Kept deliberately small so
 * it sits in the navigation rather than dominating it.
 */
export function Logo({
  tone = "dark",
  className = "",
}: {
  /** "dark" = for light backgrounds, "light" = for clay/dark backgrounds */
  tone?: "dark" | "light";
  className?: string;
}) {
  const wordmark = tone === "light" ? "text-cream" : "text-ink";
  const sub = tone === "light" ? "text-gold-bright/85" : "text-gold";
  const mark = tone === "light" ? "text-gold-bright" : "text-clay";

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label={`${restaurant.name} home`}
    >
      <OvenMark
        className={`h-[2.1rem] w-[2.1rem] shrink-0 ${mark} transition-opacity duration-300 group-hover:opacity-80`}
      />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.0625rem] tracking-tight ${wordmark}`}>
          {restaurant.name}
        </span>
        <span className={`mt-1 text-[0.5625rem] font-medium tracking-[0.22em] uppercase ${sub}`}>
          {restaurant.tagline}
        </span>
      </span>
    </Link>
  );
}
