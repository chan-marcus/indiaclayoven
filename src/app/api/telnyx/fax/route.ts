/*
 * Webhook address set on the Telnyx Fax Application. Telnyx requires one and
 * posts fax progress here, but the dashboard already asks Telnyx for each
 * fax's status (see syncFaxes in app/actions.ts), so these messages are only
 * acknowledged. Nothing is read from them, so a forged one can't change an order.
 */
export async function POST() {
  return new Response(null, { status: 204 });
}
