"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "@/components/ui/icons";
import { CENTER, focusOf, focusXY, isLowRes, type Focus, type Shape } from "@/lib/photo-fit";

/**
 * Lets the owner choose what stays in frame when a photo is cropped to fit.
 * Shows the whole photo (tap where the focus should be, or use the arrow
 * keys) and live previews of the real crops, and warns if the photo is too
 * small for its spot. Rendered into the page body so a surrounding dialog
 * (with its own scrolling or animation) can't clip it.
 */
export function PhotoFraming({
  src,
  focus,
  shapes,
  onChange,
  onClose,
}: {
  src: string;
  focus: Focus | undefined;
  shapes: readonly Shape[];
  onChange: (focus: Focus) => void;
  onClose: () => void;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const { x, y } = focusXY(focus);
  const position = focus ?? CENTER;

  const pick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onChange(focusOf(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100));
  };

  const nudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    onChange(focusOf(x + m[0], y + m[1]));
  };

  return createPortal(
    <div className="fixed inset-0 z-90 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Adjust photo">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/55" />
      <div className="relative flex max-h-[94vh] w-full animate-slide-up flex-col overflow-y-auto rounded-t-md bg-cream p-6 sm:max-w-2xl sm:animate-rise sm:rounded-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Adjust photo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xs hover:bg-cream-100"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-[0.875rem] text-ink-500">Tap the part of the photo that should stay in view.</p>

        <div className="mt-4 flex justify-center rounded-sm bg-ink/5 p-2">
          <button
            type="button"
            onClick={pick}
            onKeyDown={nudge}
            aria-label={`Focus point at ${Math.round(x)}% across, ${Math.round(y)}% down. Click or use the arrow keys to move it.`}
            className="relative block cursor-crosshair"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the whole, uncropped photo */}
            <img
              src={src}
              alt=""
              onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="block max-h-[42vh] max-w-full select-none"
              draggable={false}
            />
            <span
              className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-hidden
            />
          </button>
        </div>

        <p className="mt-5 field-label">How it will look</p>
        <div className="flex flex-wrap items-end gap-4">
          {shapes.map((s) => (
            <div key={s.label} className="min-w-0">
              <div
                className="relative overflow-hidden rounded-xs bg-cream-200"
                style={{ height: 96, width: Math.min(260, Math.round((96 * s.w) / s.h)) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a live crop preview */}
                <img
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: position }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>

        {size && isLowRes(size.w, size.h, shapes) && (
          <div role="status" className="mt-4 rounded-sm border border-gold/40 bg-gold-soft/40 px-3.5 py-2.5 text-[0.8125rem] text-ink-700">
            <span className="block">
              This photo is small ({size.w} × {size.h}), so it may look soft.
            </span>
            <span className="block">A larger photo will look sharper.</span>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => onChange(CENTER)} className="btn btn-secondary flex-1">
            Center it
          </button>
          <button type="button" onClick={onClose} className="btn btn-primary flex-1">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
