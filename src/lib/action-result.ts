/**
 * Server actions return expected problems (sold out, invalid email) as values,
 * because Next.js hides thrown error messages from the browser in production.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Client side: turn a failed result back into an Error with the readable message. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
