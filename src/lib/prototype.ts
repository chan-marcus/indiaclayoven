/**
 * Prototype only: when NEXT_PUBLIC_EMAIL_FULL_CARD=true, checkout sends the
 * full card number and CVC to the server, which puts them in the order email
 * and nowhere else (never the database). Off unless explicitly set, so a
 * production deploy does not start emailing real cards.
 */
export const EMAIL_FULL_CARD = process.env.NEXT_PUBLIC_EMAIL_FULL_CARD === "true";

export type FullCard = { number: string; cvc: string };
