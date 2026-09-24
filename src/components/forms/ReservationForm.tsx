"use client";

import { useMemo, useState } from "react";
import { telHref } from "@/lib/restaurant";
import { useRestaurantData } from "@/lib/restaurant-data";
import { IconCheck, IconPhone } from "@/components/ui/icons";

const PARTY_SIZES = ["1", "2", "3", "4", "5", "6", "7", "8", "9+"];

function useDinnerSlots() {
  return useMemo(() => {
    const out: string[] = [];
    for (let h = 17; h <= 21; h++) {
      for (const m of [0, 30]) {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        out.push(d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
      }
    }
    return out;
  }, []);
}

export function ReservationForm() {
  const { settings: restaurant } = useRestaurantData();
  const slots = useDinnerSlots();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "7:00 PM",
    party: "2",
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Please add a name for the booking.";
    if (!form.phone.trim()) errs.phone = "We need a phone number to confirm.";
    if (!form.email.trim()) errs.email = "Add an email and we will send a confirmation.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1100));
    setSubmitting(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-sm border border-cream-200 bg-white p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/12 text-success">
          <IconCheck className="h-7 w-7" />
        </span>
        <h2 className="display-md mt-6">Request received</h2>
        <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ink-500">
          Thank you, {form.name.split(" ")[0]}. We have your request for{" "}
          <span className="text-ink">
            {form.party} {Number(form.party) === 1 ? "guest" : "guests"}
          </span>{" "}
          on{" "}
          <span className="text-ink">
            {new Date(`${form.date}T12:00:00`).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>{" "}
          at <span className="text-ink">{form.time}</span>. We will call {form.phone} shortly to
          confirm.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={telHref(restaurant)} className="btn btn-secondary btn-sm">
            <IconPhone className="h-4 w-4" />
            {restaurant.phone}
          </a>
          <button type="button" onClick={() => setSent(false)} className="btn btn-secondary btn-sm">
            Make another request
          </button>
        </div>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? <p className="mt-1.5 text-xs text-danger">{errors[k]}</p> : null;

  return (
    <form onSubmit={submit} className="rounded-sm border border-cream-200 bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="r-date" className="field-label">
            Date
          </label>
          <input
            id="r-date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={form.date}
            onChange={set("date")}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="r-time" className="field-label">
            Time
          </label>
          <select id="r-time" value={form.time} onChange={set("time")} className="field-input">
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="r-party" className="field-label">
            Party size
          </label>
          <select id="r-party" value={form.party} onChange={set("party")} className="field-input">
            {PARTY_SIZES.map((p) => (
              <option key={p} value={p}>
                {p} {p === "1" ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="r-name" className="field-label">
            Name
          </label>
          <input id="r-name" value={form.name} onChange={set("name")} className="field-input" autoComplete="name" />
          {err("name")}
        </div>
        <div>
          <label htmlFor="r-phone" className="field-label">
            Phone
          </label>
          <input id="r-phone" value={form.phone} onChange={set("phone")} className="field-input" inputMode="tel" autoComplete="tel" placeholder="(415) 555-0100" />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="r-email" className="field-label">
            Email
          </label>
          <input id="r-email" value={form.email} onChange={set("email")} className="field-input" inputMode="email" autoComplete="email" placeholder="you@example.com" />
          {err("email")}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="r-notes" className="field-label">
          Anything we should know? <span className="normal-case">(optional)</span>
        </label>
        <textarea
          id="r-notes"
          value={form.notes}
          onChange={set("notes")}
          rows={3}
          className="field-input"
          placeholder="Birthday, high chair, dietary needs, seating preference…"
        />
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary btn-block mt-7">
        {submitting ? "Sending your request…" : "Request a Table"}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-ink-400">
        Requests are confirmed by phone. For same-day bookings and parties over eight, please call{" "}
        <a href={telHref(restaurant)} className="text-gold underline-offset-4 hover:underline">
          {restaurant.phone}
        </a>
        .
      </p>
    </form>
  );
}
