"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { reportFailure, useRestaurantData } from "@/lib/restaurant-data";
import { DEFAULT_TEXT, SITE_TEXT, type TextKey } from "@/lib/site-text";
import { DEFAULT_IMAGES, IMAGE_FIELD, SITE_IMAGES, isDefaultPhoto, type SitePhoto } from "@/lib/site-images";
import { autoFocus, isLowRes } from "@/lib/photo-fit";
import { PhotoFraming } from "@/components/dashboard/PhotoFraming";
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
  const [imageDraft, setImageDraft] = useState<Record<string, SitePhoto>>({});
  /** Photos just uploaded that are small for their spot. */
  const [smallPhotos, setSmallPhotos] = useState<Record<string, boolean>>({});
  /** The photo open in the Adjust window. */
  const [framing, setFraming] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  /** The text field or photo being edited, outlined in the preview. */
  const [focused, setFocused] = useState<string | undefined>();
  /** Where the preview should go: the section in view, or the field being edited. */
  const [target, setTarget] = useState<{ keys: string[]; mode: "section" | "field"; seq: number }>({
    keys: [],
    mode: "section",
    seq: 0,
  });
  const goTo = (keys: string[], mode: "section" | "field") =>
    setTarget((t) =>
      t.mode === mode && t.keys.join() === keys.join() ? t : { keys, mode, seq: t.seq + 1 },
    );
  /** Clicking into a field or photo outlines it and brings it into view. */
  const focusOn = (key: string) => {
    setFocused(key);
    goTo([key], "field");
  };
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const page = SITE_TEXT[pageIndex];
  /** Everything in a section the preview can find: its wording, then its photos. */
  const sectionKeys = (pageAt: number, index: number): string[] => {
    const p = SITE_TEXT[pageAt];
    const section = p?.sections[index];
    if (!section) return [];
    return [
      ...section.fields.map((f) => f.key),
      ...SITE_IMAGES.filter((im) => im.page === p.page && im.section === section.title).map((im) => im.key),
    ];
  };

  // The preview follows the section being edited: the last one whose top has
  // passed 40% of the way down the screen (or the first, at the top).
  useEffect(() => {
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.4;
        const cards = [...document.querySelectorAll<HTMLElement>("[data-section-index]")];
        const passed = cards.filter((c) => c.getBoundingClientRect().top < line);
        // At the very bottom, a short last section can never reach the line.
        const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        const card = atEnd ? cards.at(-1) : (passed.at(-1) ?? cards[0]);
        if (card) goTo(sectionKeys(pageIndex, Number(card.dataset.sectionIndex)), "section");
      });
    };
    window.addEventListener("scroll", follow, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", follow);
    };
  }, [pageIndex]);
  const value = (key: TextKey) => draft[key] ?? text[key];
  const unsavedText = (Object.entries(draft) as [TextKey, string][]).filter(([k, v]) => v !== text[k]);
  const samePhoto = (a: SitePhoto | undefined, b: SitePhoto | undefined) =>
    a?.src === b?.src && (a?.focus ?? "50% 50%") === (b?.focus ?? "50% 50%");
  const unsavedImages = Object.entries(imageDraft).filter(([k, v]) => !samePhoto(v, images[k]));
  const unsavedCount = unsavedText.length + unsavedImages.length;
  const imageValue = (key: string) => imageDraft[key] ?? images[key];

  const set = (key: TextKey, v: string) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [key]: v }));
  };

  const setImage = (key: string, photo: SitePhoto) => {
    setSaved(false);
    setImageDraft((d) => ({ ...d, [key]: photo }));
  };

  /** Shrinks and uploads a photo; it shows in the preview and goes live on Save. */
  const pickImage = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    focusOn(key);
    setImageErrors((x) => ({ ...x, [key]: "" }));
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const small = await shrinkImage(file, 2400);
      // Keep the busiest, most colourful part (usually the food) in frame,
      // and flag photos too small for their spot.
      const fit = await autoFocus(small).catch(() => null);
      const form = new FormData();
      form.append("photo", small, "photo");
      setImage(key, { src: unwrap(await uploadSiteImage(key, form)), focus: fit?.focus });
      const shapes = IMAGE_FIELD.get(key)?.shapes ?? [];
      setSmallPhotos((x) => ({ ...x, [key]: Boolean(fit && isLowRes(fit.width, fit.height, shapes)) }));
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
        target,
      },
      window.location.origin,
    );
  }, [ready, text, draft, images, imageDraft, focused, target, settings.phone, settings.cuisine]);

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
            SITE_IMAGES.some((im) => im.page === p.page && im.key in imageDraft && !samePhoto(imageDraft[im.key], images[im.key]));
          return (
            <button
              key={p.page}
              type="button"
              role="tab"
              aria-selected={i === pageIndex}
              onClick={() => {
                setPageIndex(i);
                setFocused(undefined);
                window.scrollTo({ top: 0 });
                // Open the preview on this page's first section (the footer, say).
                goTo(sectionKeys(i, 0), "section");
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

          {page.sections.map((section, i) => (
            <section
              key={section.title}
              data-section-index={i}
              className="rounded-sm border border-cream-300 bg-white p-6"
            >
              <h2 className="font-display text-xl">{section.title}</h2>
              <SectionPhotos
                photos={SITE_IMAGES.filter((im) => im.page === page.page && im.section === section.title)}
                value={imageValue}
                uploading={uploading}
                errors={imageErrors}
                onPick={pickImage}
                small={smallPhotos}
                onReset={(key) => {
                  setImage(key, DEFAULT_IMAGES[key]);
                  setSmallPhotos((x) => ({ ...x, [key]: false }));
                }}
                onAdjust={(key) => {
                  focusOn(key);
                  setFraming(key);
                }}
                onFocus={focusOn}
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
                          onFocus={() => focusOn(field.key)}
                          rows={Math.min(8, Math.max(2, Math.ceil(v.length / 48) + v.split("\n").length - 1))}
                          className="field-input"
                        />
                      ) : (
                        <input
                          id={id}
                          value={v}
                          onChange={(e) => set(field.key, e.target.value)}
                          onFocus={() => focusOn(field.key)}
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

      {framing && (
        <PhotoFraming
          src={imageValue(framing).src}
          focus={imageValue(framing).focus}
          shapes={IMAGE_FIELD.get(framing)?.shapes ?? []}
          onChange={(focus) => setImage(framing, { ...imageValue(framing), focus })}
          onClose={() => setFraming(null)}
        />
      )}

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
  small,
  onPick,
  onReset,
  onAdjust,
  onFocus,
}: {
  photos: readonly { key: string; section: string; label: string }[];
  value: (key: string) => SitePhoto;
  uploading: Record<string, boolean>;
  errors: Record<string, string>;
  small: Record<string, boolean>;
  onPick: (key: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: (key: string) => void;
  onAdjust: (key: string) => void;
  onFocus: (key: string) => void;
}) {
  if (photos.length === 0) return null;
  return (
    <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-5">
      {photos.map((p) => {
        const photo = value(p.key);
        const busy = uploading[p.key];
        return (
          <div key={p.key} className="min-w-0">
            <button
              type="button"
              onClick={() => onFocus(p.key)}
              aria-label={`Show ${p.section}, ${p.label} in the preview`}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-200"
            >
              <Image
                src={photo.src}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
                style={{ objectPosition: photo.focus }}
              />
              {busy && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/45 text-xs text-cream">
                  Uploading…
                </span>
              )}
            </button>
            <p className="mt-1.5 truncate text-xs text-ink-500">{p.label}</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <label
                className={`btn btn-secondary btn-sm cursor-pointer px-2 has-focus-visible:ring-2 has-focus-visible:ring-gold ${
                  busy ? "pointer-events-none opacity-45" : ""
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(e) => onPick(p.key, e)}
                  className="sr-only"
                />
                Change
              </label>
              <button
                type="button"
                onClick={() => onAdjust(p.key)}
                disabled={busy}
                className="btn btn-secondary btn-sm px-2"
              >
                Adjust
              </button>
            </div>
            {!isDefaultPhoto(p.key, photo) && (
              <button
                type="button"
                onClick={() => onReset(p.key)}
                className="mt-1.5 text-xs text-ink-500 underline-offset-4 hover:text-ink hover:underline"
              >
                Reset to original
              </button>
            )}
            {small[p.key] && !errors[p.key] && (
              <p className="mt-1 text-xs text-gold">May look blurry</p>
            )}
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
