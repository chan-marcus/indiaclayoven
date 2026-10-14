import { supabase } from "@/lib/supabase/server";
import { RESTAURANT_ID } from "@/lib/restaurant";
import { orderFromRow, type OrderRow } from "@/lib/db-rows";
import { buildOrderTicket } from "@/lib/ticket";
import { ticketPdf } from "@/lib/fax/telnyx";
import { orderNo } from "@/lib/format";

/*
 * An order's fax ticket as a PDF, opened from the dashboard's Fax page. It
 * never has the card: that's only on the first fax and is never stored.
 *
 * Like the rest of the dashboard this is open until owner login is added;
 * when it is, check the session here too.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", RESTAURANT_ID)
    .maybeSingle();
  if (error || !data) return new Response("Order not found", { status: 404 });

  const order = orderFromRow(data as OrderRow);
  const pdf = await ticketPdf(buildOrderTicket(order), `Order ${orderNo(order.number)}`);
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="order-${order.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
