"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { reportFailure, useRestaurantData } from "@/lib/restaurant-data";
import { DEFAULT_TEXT, SITE_TEXT, type TextKey } from "@/lib/site-text";
import { DEFAULT_IMAGES, SITE_IMAGES } from "@/lib/site-images";
import { uploadSiteImage } from "@/app/actions";
import { unwrap } from "@/lib/action-result";
import { shrinkImage } from "@/lib/shrink-image";
import { IconArrowRight, IconCheck } from "@/components/ui/icons";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";

/** Widths the preview renders the page at, so wraps match real screens. */
const DEVICES = { desktop: 1280, phone: 390 } as const;
type Device = keyof typeof DEVICES;

export default function EditWebsitePage() {
  const { text, images, settings, updateText, updateImages } = useRestaurantData();
  const [pageIndex, setPageIndex] = useState(0);
  const [draft, setDraft] = useState<Partial<Record<TextKey, string>>>({});
  /** Photo key → a new photo (already uploaded, not saved), or the original to reset to. */
  const [imageDraft, setImageDraft] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  /** The text field or photo being edited, outlined in the preview. */
  const [focused, setFocused] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const page = SITE_TEXT[pageIndex];
  const value = (key: TextKey) => draft[key] ?? text[key];
  const unsavedText = (Object.entries(draft) as [TextKey, string][]).filter(([k, v]) => v !== text[k]);
  const unsavedImages = Object.entries(imageDraft).filter(([k, v]) => v !== images[k]);
  const unsavedCount = unsavedText.length + unsavedImages.length;
  const imageValue = (key: string) => imageDraft[key] ?? images[key];

  const set = (key: TextKey, v: string) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [key]: v }));
  };

  const setImage = (key: string, url: string) => {
    setSaved(false);
    setImageDraft((d) => ({ ...d, [key]: url }));
  };

  /** Shrinks and uploads a photo; it shows in the preview and goes live on Save. */
  const pickImage = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFocused(key);
    setImageErrors((x) => ({ ...x, [key]: "" }));
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const form = new FormData();
      form.append("photo", await shrinkImage(file, 2400), "photo");
      setImage(key, unwrap(await uploadSiteImage(key, form)));
    } catch (err) {
      setImageErrors((x) => ({ ...x, [key]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (unsavedText.length) await updateText(Object.fromEntries(unsavedText));
      if (unsavedImages.length) await updateImages(Object.fromEntries(unsavedImages));
      setDraft({});
      setImageDraft({});
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2600);
    } catch (err) {
      reportFailure("save the website text", err);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Live preview ---------------- */

  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(0);

  // The previewed page says when it's ready for draft text.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === "ico-preview-ready") setReady((n) => n + 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Send the current wording (saved + unsaved) whenever anything changes.
  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      {
        type: "ico-preview",
        texts: { ...text, ...draft },
        images: { ...images, ...imageDraft },
        vars: { phone: settings.phone, cuisine: settings.cuisine },
        focus: focused,
      },
      window.location.origin,
    );
  }, [ready, text, draft, images, imageDraft, focused, settings.phone, settings.cuisine]);

  // Scale the page down to fit the panel, keeping its real width.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = DEVICES[device];
  const scale = box.w ? Math.min(1, box.w / width) : 0;

  const preview = (
    <div className="flex h-full flex-col overflow-hidden rounded-sm border border-cream-300 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-cream-200 px-3 py-2">
        <span className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink-400 uppercase">
          Preview · {page.page}
        </span>
        <div className="flex gap-1" role="group" aria-label="Preview size">
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={device === d}
              onClick={() => setDevice(d)}
              className={`rounded-xs border px-2.5 py-1 text-xs capitalize transition-colors ${
                device === d ? "border-clay bg-clay text-cream" : "border-cream-300 text-ink-700 hover:border-earth"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div ref={boxRef} className="relative flex-1 overflow-hidden bg-cream-100">
        {scale > 0 && (
          <iframe
            ref={frameRef}
            key={page.path}
            src={page.path}
            title={`Preview of the ${page.page} page`}
            className="absolute top-0 border-0 bg-cream"
            style={{
              width,
              height: box.h / scale,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              left: Math.max(0, (box.w - width * scale) / 2),
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="container-page py-8 pb-28">
      <h1 className="font-display text-3xl">Edit Website</h1>
      <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-500">
        <span className="block">Edit the wording and photos on any page.</span>
        <span className="block">Press Enter for a new line on the page.</span>
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Pages">
        {SITE_TEXT.map((p, i) => {
          const pending =
            p.sections.some((s) => s.fields.some((f) => f.key in draft && draft[f.key] !== text[f.key])) ||
            SITE_IMAGES.some((im) => im.page === p.page && im.key in imageDraft && imageDraft[im.key] !== images[im.key]);
          return (
            <button
              key={p.page}
              type="button"
              role="tab"
              aria-selected={i === pageIndex}
              onClick={() => {
                setPageIndex(i);
                setFocused(undefined);
              }}
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

      <button
        type="button"
        onClick={() => {
          // On a phone-sized screen, preview at phone width by default.
          if (!showPreview) setDevice("phone");
          setShowPreview(!showPreview);
        }}
        aria-expanded={showPreview}
        className="btn btn-secondary btn-sm mt-5 lg:hidden"
      >
        {showPreview ? "Hide preview" : "Show preview"}
      </button>

      <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="space-y-6">

          {page.sections.map((section) => (
            <section key={section.title} className="rounded-sm border border-cream-300 bg-white p-6">
              <h2 className="font-display text-xl">{section.title}</h2>
              <SectionPhotos
                photos={SITE_IMAGES.filter((im) => im.page === page.page && im.section === section.title)}
                value={imageValue}
                uploading={uploading}
                errors={imageErrors}
                onPick={pickImage}
                onReset={(key) => setImage(key, DEFAULT_IMAGES[key])}
                onFocus={setFocused}
              />
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
                            className="text-xs whitespace-nowrap text-ink-500 underline-offset-4 hover:text-ink hover:underline"
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
                          onFocus={() => setFocused(field.key)}
                          rows={Math.min(8, Math.max(2, Math.ceil(v.length / 48) + v.split("\n").length - 1))}
                          className="field-input"
                        />
                      ) : (
                        <input
                          id={id}
                          value={v}
                          onChange={(e) => set(field.key, e.target.value)}
                          onFocus={() => setFocused(field.key)}
                          className="field-input"
                        />
                      )}
                      {(v.includes("{phone}") || v.includes("{cuisine}")) && (
                        <p className="mt-1.5 text-xs text-ink-400">
                          {v.includes("{phone}") && <span className="block">{"{phone}"} shows your phone number.</span>}
                          {v.includes("{cuisine}") && <span className="block">{"{cuisine}"} shows your cuisine line.</span>}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div
          className={`${showPreview ? "block" : "hidden"} order-first h-[70vh] lg:sticky lg:top-32 lg:order-none lg:block lg:h-[calc(100vh-12.5rem)]`}
        >
          {preview}
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-cream-300 bg-cream/95 backdrop-blur">
        <div className="container-page flex flex-wrap items-center gap-3 py-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || unsavedCount === 0 || Object.values(uploading).some(Boolean)}
            className="btn btn-primary btn-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {unsavedCount > 0 && !saving && (
            <>
              <span className="text-[0.8125rem] text-ink-500">
                {unsavedCount} unsaved {unsavedCount === 1 ? "change" : "changes"}
              </span>
              <button
                type="button"
                onClick={() => setConfirmDiscard(true)}
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
            Open page
            <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {confirmDiscard && (
        <ConfirmDialog
          title={`Discard ${unsavedCount} unsaved ${unsavedCount === 1 ? "change" : "changes"}?`}
          body={
            <>
              <span className="block">Your edits go back to what’s live.</span>
              <span className="block">This can’t be undone.</span>
            </>
          }
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={() => {
            setDraft({});
            setImageDraft({});
            setConfirmDiscard(false);
          }}
        />
      )}
    </div>
  );
}

/** Photo tiles for one Edit Website section, each with Change and Reset. */
function SectionPhotos({
  photos,
  value,
  uploading,
  errors,
  onPick,
  onReset,
  onFocus,
}: {
  photos: readonly { key: string; section: string; label: string }[];
  value: (key: string) => string;
  uploading: Record<string, boolean>;
  errors: Record<string, string>;
  onPick: (key: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: (key: string) => void;
  onFocus: (key: string) => void;
}) {
  if (photos.length === 0) return null;
  return (
    <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
      {photos.map((p) => {
        const src = value(p.key);
        const busy = uploading[p.key];
        return (
          <div key={p.key} className="min-w-0">
            <button
              type="button"
              onClick={() => onFocus(p.key)}
              aria-label={`Show ${p.section}, ${p.label} in the preview`}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-200"
            >
              <Image src={src} alt="" fill sizes="160px" className="object-cover" />
              {busy && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/45 text-xs text-cream">
                  Uploading…
                </span>
              )}
            </button>
            <p className="mt-1.5 truncate text-xs text-ink-500">{p.label}</p>
            <div className="mt-0.5 flex gap-3 text-[0.8125rem]">
              <label className="cursor-pointer text-ink-700 underline-offset-4 hover:text-ink hover:underline has-focus-visible:underline">
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(e) => onPick(p.key, e)}
                  className="sr-only"
                />
                Change
              </label>
              {src !== DEFAULT_IMAGES[p.key] && (
                <button
                  type="button"
                  onClick={() => onReset(p.key)}
                  className="text-ink-500 underline-offset-4 hover:text-ink hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            {errors[p.key] && (
              <p role="alert" className="mt-1 text-xs text-danger">
                {errors[p.key]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
