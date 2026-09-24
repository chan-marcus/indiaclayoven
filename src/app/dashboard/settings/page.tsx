"use client";

import { useState } from "react";
import { useDashboard } from "@/lib/dashboard-data";
import { reportFailure } from "@/lib/restaurant-data";
import { IconCheck, IconMail } from "@/components/ui/icons";

export default function SettingsPage() {
  const { settings, updateSettings } = useDashboard();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: settings.name,
    street: settings.address.street,
    city: settings.address.city,
    state: settings.address.state,
    zip: settings.address.zip,
    phone: settings.phone,
    hours: settings.hours.summary,
    buffet: settings.hours.buffet,
    emailEnabled: settings.orderEmail.enabled,
    emailAddress1: settings.orderEmail.addresses[0] ?? "",
    emailAddress2: settings.orderEmail.addresses[1] ?? "",
    ownerName: settings.owner.name,
    ownerEmail: settings.owner.email,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        name: form.name,
        phone: form.phone,
        address: { ...settings.address, street: form.street, city: form.city, state: form.state, zip: form.zip },
        hours: { ...settings.hours, summary: form.hours, buffet: form.buffet },
        orderEmail: {
          enabled: form.emailEnabled,
          addresses: [form.emailAddress1, form.emailAddress2].filter((a) => a.trim()),
        },
        owner: { name: form.ownerName, email: form.ownerEmail },
      });
    } catch (err) {
      reportFailure("save your settings", err);
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  return (
    <form onSubmit={save} className="container-page py-8">
      <h1 className="font-display text-3xl">Settings</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-500">
        The details customers see on your website, and how orders reach your kitchen.
      </p>

      <div className="mt-8 max-w-3xl space-y-6">
        {/* Restaurant information */}
        <section className="rounded-sm border border-cream-300 bg-white p-6">
          <h2 className="font-display text-xl">Restaurant information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="s-name" className="field-label">
                Restaurant name
              </label>
              <input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-street" className="field-label">
                Street address
              </label>
              <input id="s-street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="field-input" />
            </div>
            <div>
              <label htmlFor="s-city" className="field-label">
                City
              </label>
              <input id="s-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="s-state" className="field-label">
                  State
                </label>
                <input id="s-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="field-input" />
              </div>
              <div>
                <label htmlFor="s-zip" className="field-label">
                  ZIP
                </label>
                <input id="s-zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="field-input" />
              </div>
            </div>
            <div>
              <label htmlFor="s-phone" className="field-label">
                Phone
              </label>
              <input id="s-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field-input" />
            </div>
            <div>
              <label htmlFor="s-hours" className="field-label">
                Hours
              </label>
              <input id="s-hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="field-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-buffet" className="field-label">
                Buffet
              </label>
              <input id="s-buffet" value={form.buffet} onChange={(e) => setForm({ ...form, buffet: e.target.value })} className="field-input" />
            </div>
          </div>
        </section>

        {/* Order email */}
        <section className="rounded-sm border border-cream-300 bg-white p-6">
          <div className="flex items-center gap-2.5">
            <IconMail className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl">Email orders</h2>
            <span className="rounded-xs border border-cream-300 bg-cream-100 px-2 py-0.5 text-[0.625rem] font-medium tracking-[0.09em] text-ink-500 uppercase">
              Optional
            </span>
          </div>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-500">
            Turn this on and every new order is emailed to you the moment it is placed.
          </p>

          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-sm border border-cream-300 bg-cream-100/50 p-4">
            <span className="text-[0.9375rem] font-medium">
              Email new orders
            </span>
            <span className="flex items-center gap-2.5">
              <span className="hidden text-[0.8125rem] text-ink-500 sm:inline">
                {form.emailEnabled ? "On" : "Off"}
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={form.emailEnabled}
                onChange={(e) => setForm({ ...form, emailEnabled: e.target.checked })}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                  form.emailEnabled ? "bg-success" : "bg-ink-400/45"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    form.emailEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </span>
            </span>
          </label>

          {form.emailEnabled && (
            <fieldset className="mt-4 animate-rise">
              <legend className="field-label">Send orders to</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="email"
                  aria-label="First email address"
                  required
                  value={form.emailAddress1}
                  onChange={(e) => setForm({ ...form, emailAddress1: e.target.value })}
                  placeholder="you@example.com"
                  className="field-input"
                />
                <input
                  type="email"
                  aria-label="Second email address (optional)"
                  value={form.emailAddress2}
                  onChange={(e) => setForm({ ...form, emailAddress2: e.target.value })}
                  placeholder="Second address (optional)"
                  className="field-input"
                />
              </div>
              <p className="mt-2 text-xs text-ink-400">
                <span className="block">Every new order goes to each address.</span>
                <span className="block">Any that fail can be resent from Orders.</span>
              </p>
            </fieldset>
          )}
        </section>

        {/* Account */}
        <section className="rounded-sm border border-cream-300 bg-white p-6">
          <h2 className="font-display text-xl">Account</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-owner" className="field-label">
                Owner name
              </label>
              <input id="s-owner" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="field-input" />
            </div>
            <div>
              <label htmlFor="s-email" className="field-label">
                Email
              </label>
              <input id="s-email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} className="field-input" inputMode="email" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-pass" className="field-label">
                Password
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input id="s-pass" type="password" value="••••••••••" readOnly className="field-input sm:max-w-xs" />
                <button type="button" className="btn btn-secondary btn-sm" disabled>
                  Change password
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-400">
                Sign-in is not wired up in this prototype.
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
          {saved && (
            <span className="inline-flex animate-fade-in items-center gap-2 text-[0.875rem] text-success">
              <IconCheck className="h-4 w-4" />
              Saved. Your website is updated
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
