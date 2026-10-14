import "server-only";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";

/*
 * Faxing order tickets through Telnyx Programmable Fax
 * (https://developers.telnyx.com/docs/programmable-fax).
 *
 * Needs three environment variables:
 *   TELNYX_API_KEY            API v2 key (Portal → Auth → API Keys)
 *   TELNYX_FAX_CONNECTION_ID  the Fax Application's ID (Portal → Programmable Fax)
 *   TELNYX_FAX_FROM           a Telnyx number on that application, E.164 (+1415…)
 *
 * The ticket PDF is built in memory and uploaded with the request, so it is
 * never at a public link and nothing is stored on our side.
 */

const API = "https://api.telnyx.com/v2/faxes";

export const faxConfigured = () =>
  Boolean(process.env.TELNYX_API_KEY && process.env.TELNYX_FAX_CONNECTION_ID && process.env.TELNYX_FAX_FROM);

/* ------------------------------------------------------------------ */
/* Ticket PDF                                                          */
/* ------------------------------------------------------------------ */

const PAGE = { w: 612, h: 792 }; // US Letter, in points
const MARGIN = 54;
const SIZE = 11;
const LEADING = 15;

/**
 * The PDF fonts only cover Western European characters; anything else
 * (an emoji in a note, say) would stop the fax, so it becomes "?".
 */
function printable(s: string) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/gu, "?");
}

/** Splits a line to fit the page, carrying on under a small indent. */
function wrap(line: string, font: PDFFont, size: number, width: number): string[] {
  if (font.widthOfTextAtSize(line, size) <= width) return [line];
  const out: string[] = [];
  let rest = line;
  let indent = "";
  while (rest && font.widthOfTextAtSize(indent + rest, size) > width) {
    const fit = Math.max(1, Math.floor((width / font.widthOfTextAtSize("M", size)) - indent.length));
    let cut = rest.lastIndexOf(" ", fit);
    if (cut <= 0) cut = fit;
    out.push(indent + rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
    indent = "      ";
  }
  if (rest) out.push(indent + rest);
  return out;
}

/** The ticket on letter-size pages: the first line large and bold, the rest in Courier. */
export async function ticketPdf(lines: string[], title: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  const font = await pdf.embedFont(StandardFonts.Courier);
  const bold = await pdf.embedFont(StandardFonts.CourierBold);
  const width = PAGE.w - MARGIN * 2;

  let page = pdf.addPage([PAGE.w, PAGE.h]);
  let y = PAGE.h - MARGIN;
  const newPageIfNeeded = (needed: number) => {
    if (y - needed >= MARGIN) return;
    page = pdf.addPage([PAGE.w, PAGE.h]);
    y = PAGE.h - MARGIN;
  };

  lines.forEach((raw, i) => {
    const heading = i === 0;
    const f = heading ? bold : font;
    const size = heading ? 18 : SIZE;
    for (const part of wrap(printable(raw), f, size, width)) {
      newPageIfNeeded(heading ? 24 : LEADING);
      y -= heading ? 22 : LEADING;
      page.drawText(part, { x: MARGIN, y, size, font: f });
    }
    if (heading) y -= 6;
  });

  return pdf.save();
}

/* ------------------------------------------------------------------ */
/* Telnyx API                                                          */
/* ------------------------------------------------------------------ */

export type SendResult = { ok: true; id: string; status: string } | { ok: false; reason: string };

type TelnyxError = { errors?: { title?: string; detail?: string }[] };

const errorText = (body: TelnyxError | null, status: number) =>
  (body?.errors?.[0]?.detail || body?.errors?.[0]?.title || `Fax service error ${status}`).slice(0, 140);

/** Sends one fax of the PDF. Telnyx then works on it; check progress with faxStatus. */
export async function sendFax(pdf: Uint8Array, to: string): Promise<SendResult> {
  if (!faxConfigured()) return { ok: false, reason: "Fax service not set up" };
  const form = new FormData();
  form.append("connection_id", process.env.TELNYX_FAX_CONNECTION_ID!);
  form.append("from", process.env.TELNYX_FAX_FROM!);
  form.append("to", to);
  form.append("contents", new Blob([pdf as BlobPart], { type: "application/pdf" }), "order.pdf");
  // Text tickets fax most legibly in black and white.
  form.append("monochrome", "true");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` },
      body: form,
      signal: AbortSignal.timeout(20_000),
    });
    const body = (await res.json().catch(() => null)) as ({ data?: { id: string; status: string } } & TelnyxError) | null;
    if (res.ok && body?.data?.id) return { ok: true, id: body.data.id, status: body.data.status ?? "queued" };
    console.error("Telnyx rejected fax", res.status, body?.errors);
    return { ok: false, reason: errorText(body, res.status) };
  } catch (err) {
    console.error("Fax send failed", err);
    return { ok: false, reason: "Could not reach the fax service" };
  }
}

/** Where a sent fax has got to: queued, sending, delivered, failed… */
export async function faxStatus(id: string): Promise<{ status: string; failureReason?: string } | null> {
  if (!process.env.TELNYX_API_KEY) return null;
  try {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { status: string; failure_reason?: string | null } };
    return body.data ? { status: body.data.status, failureReason: body.data.failure_reason ?? undefined } : null;
  } catch {
    return null;
  }
}

/** Telnyx's failure codes, said plainly for the dashboard. */
export function failureText(reason: string | undefined): string {
  const r = reason ?? "";
  if (/busy/.test(r)) return "The fax line was busy";
  if (/no_answer|no_response|timeout/.test(r)) return "The fax machine didn't answer";
  if (/decline/.test(r)) return "The fax machine declined the call";
  if (/invalid|unallocated|unreachable|not_in/.test(r)) return "That fax number can't be reached";
  if (/limit|spend/.test(r)) return "Fax account limit reached";
  if (/account_disabled|no_outbound_profile/.test(r)) return "The fax account isn't set up to send";
  if (/dropped|communication|signaling|ecm|incompatible/.test(r)) return "The call dropped partway";
  return r ? r.replace(/_/g, " ") : "The fax didn't go through";
}
