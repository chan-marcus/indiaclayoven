"use client";

import { useState } from "react";
import { restaurant, telHref } from "@/lib/data/restaurant";
import { IconCheck, IconPhone } from "@/components/ui/icons";

const EVENT_TYPES = [
  "Birthday",
  "Wedding or engagement",
  "Rehearsal dinner",
  "Corporate event",
  "Private party",
  "Off-site catering",
  "Something else",
];

export function CateringForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    guests: "",
    type: EVENT_TYPES[0],
    message: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Please add your name.";
    if (!form.email.trim()) errs.email = "We need an email to reply to.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "That email does not look right.";
    if (!form.guests.trim()) errs.guests = "Roughly how many guests?";
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
        <h2 className="display-md mt-6">Thank you. We will be in touch</h2>
        <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ink-500">
          We have your enquiry for {form.guests} guests
          {form.date
            ? ` on ${new Date(`${form.date}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}`
            : ""}
          . One of us will reply to {form.email} within a day, usually sooner.
        </p>
        <a href={telHref} className="btn btn-secondary btn-sm mt-7">
          <IconPhone className="h-4 w-4" />
          Or call {restaurant.phone}
        </a>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? <p className="mt-1.5 text-xs text-danger">{errors[k]}</p> : null;

  return (
    <form onSubmit={submit} className="rounded-sm border border-cream-200 bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">
            Name
          </label>
          <input id="c-name" value={form.name} onChange={set("name")} className="field-input" autoComplete="name" />
          {err("name")}
        </div>
        <div>
          <label htmlFor="c-phone" className="field-label">
            Phone
          </label>
          <input id="c-phone" value={form.phone} onChange={set("phone")} className="field-input" inputMode="tel" autoComplete="tel" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-email" className="field-label">
            Email
          </label>
          <input id="c-email" value={form.email} onChange={set("email")} className="field-input" inputMode="email" autoComplete="email" />
          {err("email")}
        </div>
        <div>
          <label htmlFor="c-date" className="field-label">
            Event date
          </label>
          <input id="c-date" type="date" value={form.date} onChange={set("date")} className="field-input" />
        </div>
        <div>
          <label htmlFor="c-guests" className="field-label">
            Guest count
          </label>
          <input id="c-guests" value={form.guests} onChange={set("guests")} className="field-input" inputMode="numeric" placeholder="e.g. 40" />
          {err("guests")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-type" className="field-label">
            Event type
          </label>
          <select id="c-type" value={form.type} onChange={set("type")} className="field-input">
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-message" className="field-label">
            Tell us about it
          </label>
          <textarea
            id="c-message"
            value={form.message}
            onChange={set("message")}
            rows={4}
            className="field-input"
            placeholder="Where, roughly what time, any dishes you have in mind, dietary needs…"
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary btn-block mt-7">
        {submitting ? "Sending your enquiry…" : "Send Enquiry"}
      </button>

      <p className="mt-4 text-center text-xs text-ink-400">
        We usually reply the same day. In a hurry? Call{" "}
        <a href={telHref} className="text-gold underline-offset-4 hover:underline">
          {restaurant.phone}
        </a>
        .
      </p>
    </form>
  );
}
