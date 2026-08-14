/**
 * The house mark: a charcoal-fired clay oven.
 *
 * Filled silhouettes in currentColor so it stays crisp at nav size (~34px)
 * and reads on both cream and clay backgrounds. The stoke hole is knocked
 * out with evenodd rather than painted, so no background colour is baked in.
 */
export function OvenMark({
  className = "h-9 w-9",
  ground = true,
}: {
  className?: string;
  /** The ground line reads as grit at large sizes; drop it in tight spots. */
  ground?: boolean;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      {/* Flames from the mouth */}
      <path d="M15.2 8.8c-1.3-2.5-.2-4.8 1.6-7.3-.1 2.5.85 3.75 1.7 4.9.5-.95.65-1.8.4-2.6 1.8 2.2 2.2 4 1.35 5.5Z" />
      <path d="M12.4 9.2c-1.25-1.45-1.35-3.2-.6-4.7.2 1.55.95 2.5 1.85 3.25-.3.45-.6.95-.6 1.45Z" />

      {/* Rim of the mouth */}
      <ellipse cx="16" cy="10" rx="4.4" ry="1.5" />

      {/* Body with the stoke hole knocked out */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 10.3C9 12.1 6.3 16 5.6 20.5c-.6 3.9-.2 6.7-.1 7.15.05.28.25.45.5.45h20c.25 0 .45-.17.5-.45.1-.45.5-3.25-.1-7.15-.7-4.5-3.4-8.4-6.4-10.2a4.4 1.5 0 0 1-8 0Zm4 10.5c-1.65 0-3 1.35-3 3V28h6v-4.2c0-1.65-1.35-3-3-3Z"
      />

      {/* Ground */}
      {ground && <rect x="3.6" y="29" width="24.8" height="1.4" rx=".7" opacity=".5" />}
    </svg>
  );
}
