"use client";

import { useState } from "react";
import { reportFailure, useRestaurantData } from "@/lib/restaurant-data";
import { DEFAULT_TEXT, SITE_TEXT, type TextKey } from "@/lib/site-text";
import { IconArrowRight, IconCheck } from "@/components/ui/icons";

export default function WebsiteTextPage() {
  const { text, updateText } = useRestaurantData();
  const [pageIndex, setPageIndex] = useState(0);
  const [draft, setDraft] = useState<Partial<Record<TextKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const page = SITE_TEXT[pageIndex];
  const value = (key: TextKey) => draft[key] ?? text[key];
  const unsaved = (Object.entries(draft) as [TextKey, string][]).filter(([k, v]) => v !== text[k]);

  const set = (key: TextKey, v: string) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [key]: v }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateText(Object.fromEntries(unsaved));
      setDraft({});
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch (err) {
      reportFailure("save the website text", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page py-8 pb-28">
      <h1 className="font-display text-3xl">Website text</h1>
      <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-500">
        <span className="block">Edit the wording on any page.</span>
        <span className="block">Press Enter for a new line on the page.</span>
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Pages">
        {SITE_TEXT.map((p, i) => {
          const pending = p.sections.some((s) => s.fields.some((f) => f.key in draft && draft[f.key] !== text[f.key]));
          return (
            <button
              key={p.page}
              type="button"
              role="tab"
              aria-selected={i === pageIndex}
              onClick={() => setPageIndex(i)}
              className={`rounded-xs border px-3 py-1.5 text-[0.8125rem] transition-colors ${
                i === pageIndex
                  ? "border-clay bg-clay text-cream"
                  : "border-cream-300 bg-white text-ink-700 hover:border-earth"
              }`}
            >
              {p.page}
              {pending && <span aria-label="unsaved changes"> •</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-6 max-w-3xl space-y-6">
        {page.sections.map((section) => (
          <section key={section.title} className="rounded-sm border border-cream-300 bg-white p-6">
            <h2 className="font-display text-xl">{section.title}</h2>
            <div className="mt-5 space-y-5">
              {section.fields.map((field) => {
                const v = value(field.key);
                const edited = v !== DEFAULT_TEXT[field.key];
                const id = `t-${field.key}`;
                return (
                  <div key={field.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor={id} className="field-label">
                        {field.label}
                      </label>
                      {edited && (
                        <button
                          type="button"
                          onClick={() => set(field.key, DEFAULT_TEXT[field.key])}
                          className="text-xs text-ink-500 underline-offset-4 hover:text-ink hover:underline"
                        >
                          Reset to original
                        </button>
                      )}
                    </div>
                    {"long" in field && field.long ? (
                      <textarea
                        id={id}
                        value={v}
                        onChange={(e) => set(field.key, e.target.value)}
                        rows={Math.min(8, Math.max(2, Math.ceil(v.length / 70) + v.split("\n").length - 1))}
                        className="field-input"
                      />
                    ) : (
                      <input
                        id={id}
                        value={v}
                        onChange={(e) => set(field.key, e.target.value)}
                        className="field-input"
                      />
                    )}
                    {v.includes("{phone}") || v.includes("{cuisine}") ? (
                      <p className="mt-1.5 text-xs text-ink-400">
                        {v.includes("{phone}") ? "{phone} shows your phone number from Settings." : ""}
                        {v.includes("{cuisine}") ? " {cuisine} shows your cuisine line." : ""}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-cream-300 bg-cream/95 backdrop-blur">
        <div className="container-page flex flex-wrap items-center gap-3 py-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || unsaved.length === 0}
            className="btn btn-primary btn-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {unsaved.length > 0 && !saving && (
            <>
              <span className="text-[0.8125rem] text-ink-500">
                {unsaved.length} unsaved {unsaved.length === 1 ? "change" : "changes"}
              </span>
              <button
                type="button"
                onClick={() => setDraft({})}
                className="text-[0.8125rem] text-ink-500 underline-offset-4 hover:text-ink hover:underline"
              >
                Discard
              </button>
            </>
          )}
          {saved && (
            <span className="inline-flex animate-fade-in items-center gap-2 text-[0.8125rem] text-success">
              <IconCheck className="h-4 w-4" />
              Saved. Your website is updated
            </span>
          )}
          <a
            href={page.path}
            target="_blank"
            rel="noopener noreferrer"
            className="group ml-auto inline-flex items-center gap-2 text-[0.8125rem] text-ink-500 hover:text-ink"
          >
            View page
            <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  );
}
