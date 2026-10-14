"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { faxOverview, resendOrderFax, sendTestFax, setFaxEnabled, type FaxLogEntry, type FaxOverview } from "@/app/actions";
import { unwrap } from "@/lib/action-result";
import { reportFailure } from "@/lib/restaurant-data";
import { formatPhone, orderNo } from "@/lib/format";
import { RESTAURANT_TIME_ZONE } from "@/lib/restaurant";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { IconCheck, IconClose, IconReceipt } from "@/components/ui/icons";

/** How often the page asks Telnyx for news while it's open. */
const POLL_MS = 15_000;

type Group = "progress" | "delivered" | "failed";

const groupOf = (status: string): Group =>
  status === "delivered" ? "delivered" : status === "failed" ? "failed" : "progress";

const BADGE: Record<Group, { label: string; tone: string }> = {
  progress: { label: "Faxing…", tone: "border-gold/40 bg-gold-soft/40 text-[#7a5716]" },
  delivered: { label: "Delivered", tone: "border-success/30 bg-success/8 text-success" },
  failed: { label: "Failed", tone: "border-danger/30 bg-danger/8 text-danger" },
};

const FILTERS: { v: Group | "all"; label: string }[] = [
  { v: "all", label: "All" },
  { v: "progress", label: "In progress" },
  { v: "delivered", label: "Delivered" },
  { v: "failed", label: "Failed" },
];

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: RESTAURANT_TIME_ZONE });
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: RESTAURANT_TIME_ZONE });
const sameDay = (a: Date, b: Date) =>
  a.toLocaleDateString("en-US", { timeZone: RESTAURANT_TIME_ZONE }) ===
  b.toLocaleDateString("en-US", { timeZone: RESTAURANT_TIME_ZONE });

export default function FaxPage() {
  const [data, setData] = useState<(FaxOverview & { stale?: boolean }) | null>(null);
  const [loadError, setLoadError] = useState("");
  const [updated, setUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Group | "all">("all");
  const [confirmTest, setConfirmTest] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  /** The last full log from Telnyx, kept on screen if a later refresh can't reach it. */
  const lastGood = useRef<FaxOverview | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = unwrap(await faxOverview());
      if (next.logSource === "orders" && lastGood.current) {
        // Telnyx hiccuped mid-session: keep its last full log on screen.
        setData({ ...next, log: lastGood.current.log, stale: true });
      } else {
        if (next.logSource === "telnyx") lastGood.current = next;
        setData(next);
        setUpdated(new Date());
      }
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Loads the fax log on arrival, then keeps it fresh while the page is open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = window.setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const flash = (tone: "ok" | "error", text: string) => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 6000);
  };

  const toggle = async () => {
    if (!data) return;
    const next = !data.enabled;
    setData({ ...data, enabled: next });
    try {
      unwrap(await setFaxEnabled(next));
    } catch (err) {
      setData({ ...data, enabled: !next });
      reportFailure(next ? "turn on faxing" : "turn off faxing", err);
    }
  };

  const runTest = async () => {
    setConfirmTest(false);
    setBusy((b) => ({ ...b, test: true }));
    try {
      const r = unwrap(await sendTestFax());
      if (r.failed.length) flash("error", `Test fax not sent: ${r.failed[0]}`);
      else flash("ok", r.sent === 1 ? "Test fax sent. It should print within a minute or two." : `${r.sent} test faxes sent.`);
      await load();
    } catch (err) {
      flash("error", err instanceof Error ? err.message : String(err));
    } finally {
      setBusy((b) => ({ ...b, test: false }));
    }
  };

  const resend = async (entry: FaxLogEntry) => {
    if (!entry.order) return;
    setBusy((b) => ({ ...b, [entry.id]: true }));
    try {
      unwrap(await resendOrderFax(entry.order.id));
      flash("ok", `Order ${orderNo(entry.order.number)} faxed again.`);
      await load();
    } catch (err) {
      flash("error", err instanceof Error ? err.message : String(err));
    } finally {
      setBusy((b) => ({ ...b, [entry.id]: false }));
    }
  };

  const log = data?.log ?? [];
  const today = log.filter((f) => sameDay(new Date(f.createdAt), new Date()));
  const count = (list: FaxLogEntry[], g: Group) => list.filter((f) => groupOf(f.status) === g).length;
  const shown = filter === "all" ? log : log.filter((f) => groupOf(f.status) === filter);

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Fax</h1>
          <p className="mt-2 text-[0.9375rem] text-ink-500">Orders print on your kitchen fax.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={refreshing} className="btn btn-secondary btn-sm">
            {refreshing ? "Checking…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmTest(true)}
            disabled={!data || busy.test || data.kitchenNumbers.length === 0}
            className="btn btn-primary btn-sm"
          >
            {busy.test ? "Sending…" : "Send test fax"}
          </button>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className={`mt-5 rounded-sm border px-4 py-3 text-[0.875rem] ${
            notice.tone === "ok" ? "border-success/30 bg-success/8 text-success" : "border-danger/30 bg-danger/8 text-danger"
          }`}
        >
          {notice.text}
        </p>
      )}
      {loadError && (
        <p role="alert" className="mt-5 rounded-sm border border-danger/30 bg-danger/8 px-4 py-3 text-[0.875rem] text-danger">
          Couldn&rsquo;t load the fax page: {loadError}
        </p>
      )}

      {!data && !loadError && <p className="mt-8 text-ink-500">Checking with Telnyx…</p>}

      {data && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Connection data={data} onToggle={toggle} />
            <Today total={today.length} delivered={count(today, "delivered")} failed={count(today, "failed")} progress={count(today, "progress")} />
          </div>

          {/* Log */}
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-xl">Fax log</h2>
              {updated && <p className="text-xs text-ink-400">Updated {time(updated.toISOString())}</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Show">
              {FILTERS.map((f) => {
                const n = f.v === "all" ? log.length : count(log, f.v);
                return (
                  <button
                    key={f.v}
                    type="button"
                    aria-pressed={filter === f.v}
                    onClick={() => setFilter(f.v)}
                    className={`rounded-xs border px-3 py-1.5 text-[0.8125rem] whitespace-nowrap transition-colors ${
                      filter === f.v ? "border-clay bg-clay text-cream" : "border-cream-300 bg-white text-ink-700 hover:border-earth"
                    }`}
                  >
                    {f.label} <span className="tabular-nums opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>

            {(data.logSource === "orders" || data.stale) && (
              <p className="mt-3 rounded-sm border border-gold/40 bg-gold-soft/30 px-4 py-2.5 text-[0.8125rem] text-ink-700">
                {data.stale ? (
                  <span className="block">Telnyx didn&rsquo;t answer just now, so this is the last update.</span>
                ) : (
                  <>
                    <span className="block">Telnyx didn&rsquo;t answer just now, so these are the order faxes saved here.</span>
                    <span className="block">It&rsquo;ll try again in a few seconds.</span>
                  </>
                )}
              </p>
            )}
            {shown.length === 0 ? (
              <p className="mt-4 rounded-sm border border-cream-300 bg-white p-6 text-ink-500">
                {log.length === 0 ? "No faxes yet. They appear here as orders come in." : "Nothing here."}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-cream-200 overflow-hidden rounded-sm border border-cream-300 bg-white">
                {shown.map((f) => (
                  <LogRow key={f.id} entry={f} busy={busy[f.id]} onResend={() => resend(f)} />
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-400">The latest 50 faxes, newest first.</p>
          </section>
        </>
      )}

      {confirmTest && data && (
        <ConfirmDialog
          title="Send a test fax?"
          body={
            <>
              <span className="block">One page saying it&rsquo;s a test will print at</span>
              <span className="block font-medium text-ink-700">{data.kitchenNumbers.map(formatPhone).join(" and ")}.</span>
            </>
          }
          confirmLabel="Send test fax"
          cancelLabel="Cancel"
          tone="primary"
          onCancel={() => setConfirmTest(false)}
          onConfirm={runTest}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Connection({ data, onToggle }: { data: FaxOverview; onToggle: () => void }) {
  const h = data.health;
  const checks: { ok: boolean; label: string; detail?: string }[] = [
    { ok: h.configured && h.keyWorks, label: "Telnyx account connected", detail: h.configured ? undefined : "Add the Telnyx settings on Vercel" },
    {
      ok: Boolean(h.app?.active && h.app.outbound),
      label: h.app ? `Fax app “${h.app.name}”` : "Fax app",
      detail: !h.app ? "Not found" : !h.app.active ? "Turned off in Telnyx" : !h.app.outbound ? "No outbound profile" : undefined,
    },
    {
      ok: Boolean(h.number?.active && h.number.onApp),
      label: `Sending from ${formatPhone(h.from)}`,
      detail: !h.number ? "Number not found" : !h.number.active ? "Number not active" : !h.number.onApp ? "Not linked to the fax app" : undefined,
    },
    {
      ok: data.kitchenNumbers.length > 0,
      label: data.kitchenNumbers.length ? `Kitchen fax ${data.kitchenNumbers.map(formatPhone).join(", ")}` : "No kitchen fax number",
      detail: data.kitchenNumbers.length ? undefined : "Add one in Settings",
    },
  ];
  const ready = checks.every((c) => c.ok);

  return (
    <section className="rounded-sm border border-cream-300 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">Connection</h2>
        <span
          className={`rounded-xs border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
            ready ? "border-success/30 bg-success/8 text-success" : "border-danger/30 bg-danger/8 text-danger"
          }`}
        >
          {ready ? "Ready" : "Needs attention"}
        </span>
      </div>

      <ul className="mt-4 space-y-2.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2.5 text-[0.875rem]">
            <span
              className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${
                c.ok ? "bg-success text-white" : "bg-danger text-white"
              }`}
              aria-hidden
            >
              {c.ok ? <IconCheck className="h-3 w-3" /> : <IconClose className="h-3 w-3" />}
            </span>
            <span className="min-w-0">
              <span className="block">{c.label}</span>
              {c.detail && <span className="block text-xs text-danger">{c.detail}</span>}
            </span>
          </li>
        ))}
      </ul>

      <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-sm border border-cream-300 bg-cream-100/50 p-4">
        <span className="text-[0.9375rem] font-medium">Fax new orders</span>
        <span className="flex items-center gap-2.5">
          <span className="text-[0.8125rem] text-ink-500">{data.enabled ? "On" : "Off"}</span>
          <input type="checkbox" role="switch" checked={data.enabled} onChange={onToggle} className="sr-only" />
          <span
            aria-hidden
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
              data.enabled ? "bg-success" : "bg-ink-400/45"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                data.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </span>
      </label>
      <p className="mt-2.5 text-xs text-ink-400">
        Change the kitchen number in{" "}
        <Link href="/dashboard/settings" className="underline underline-offset-2 hover:text-ink">
          Settings
        </Link>
        .
      </p>
    </section>
  );
}

function Today({ total, delivered, failed, progress }: { total: number; delivered: number; failed: number; progress: number }) {
  const stats = [
    { label: "Sent today", value: total },
    { label: "Delivered", value: delivered },
    { label: "Failed", value: failed },
    { label: "In progress", value: progress },
  ];
  return (
    <section className="rounded-sm border border-cream-300 bg-white p-6">
      <h2 className="font-display text-xl">Today</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-sm border border-cream-200 bg-cream-100/50 px-4 py-3">
            <dt className="text-[0.6875rem] font-medium tracking-[0.12em] whitespace-nowrap text-ink-400 uppercase">
              {s.label}
            </dt>
            <dd
              className={`mt-1 font-display text-2xl tabular-nums ${
                s.label === "Failed" && s.value > 0 ? "text-danger" : ""
              }`}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LogRow({ entry, busy, onResend }: { entry: FaxLogEntry; busy?: boolean; onResend: () => void }) {
  const g = groupOf(entry.status);
  // The separator stays with the name, so a wrap never leaves it dangling.
  const what = entry.order ? (
    <>
      Order {orderNo(entry.order.number)} <span className="whitespace-nowrap">· {entry.order.customer}</span>
    </>
  ) : entry.test ? (
    "Test fax"
  ) : (
    "Other fax"
  );

  const badge = (extra: string) => (
    <span className={`rounded-xs border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${BADGE[g].tone} ${extra}`}>
      {BADGE[g].label}
    </span>
  );

  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 gap-3">
        <IconReceipt className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-[0.9375rem] font-medium">{what}</p>
            {badge("sm:hidden")}
          </div>
          <p className="text-[0.8125rem] text-ink-500">
            {day(entry.createdAt)}, {time(entry.createdAt)} · to{" "}
            <span className="whitespace-nowrap">{formatPhone(entry.to)}</span>
          </p>
          {entry.reason && <p className="mt-0.5 text-[0.8125rem] text-danger">{entry.reason}</p>}
        </div>
      </div>
      <div className={`items-center gap-2 pl-8 sm:pl-0 ${entry.order ? "flex" : "hidden sm:flex"}`}>
        {badge("hidden sm:inline-block")}
        {entry.order && (
          <>
            <a
              href={`/dashboard/fax/ticket/${entry.order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              View ticket
            </a>
            <button type="button" onClick={onResend} disabled={busy} className="btn btn-secondary btn-sm">
              {busy ? "Sending…" : "Resend"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
