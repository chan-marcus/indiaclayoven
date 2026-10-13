/*
 * Making any photo fit its spot nicely. Every photo on the site fills a box
 * of a fixed shape (object-fit: cover), so part of it is cropped. These
 * helpers decide what stays in frame (the "focus") and warn when a photo is
 * too small for its spot.
 */

/** A box a photo is shown in, in CSS pixels at its usual size. */
export type Shape = { label: string; w: number; h: number };

/** Where to keep in frame, as a CSS object-position: "50% 35%". */
export type Focus = string;

export const CENTER: Focus = "50% 50%";

const FOCUS_RE = /^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/;

/** True for a well-formed focus with both values from 0% to 100%. */
export function isFocus(value: unknown): value is Focus {
  const m = typeof value === "string" ? FOCUS_RE.exec(value) : null;
  return Boolean(m && Number(m[1]) <= 100 && Number(m[2]) <= 100);
}

export const focusOf = (x: number, y: number): Focus =>
  `${Math.round(Math.min(100, Math.max(0, x)))}% ${Math.round(Math.min(100, Math.max(0, y)))}%`;

export function focusXY(focus: Focus | undefined): { x: number; y: number } {
  const m = focus ? FOCUS_RE.exec(focus) : null;
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 };
}

/**
 * True when a photo would be blown up noticeably to fill one of its shapes,
 * so it may look soft. Retina screens need more; this flags the clear cases.
 */
export function isLowRes(width: number, height: number, shapes: readonly Shape[]): boolean {
  if (!width || !height) return false;
  return shapes.some((s) => Math.max(s.w / width, s.h / height) > 1.25);
}

/** Dish photos appear in these boxes around the site. */
export const DISH_SHAPES: readonly Shape[] = [
  { label: "Menu list", w: 96, h: 96 },
  { label: "Dish popup", w: 403, h: 520 },
  { label: "Phone popup", w: 390, h: 208 },
];

/**
 * Finds the part of a photo worth keeping in frame: where there's detail and
 * colour (usually the food), leaning slightly towards the middle. Runs in the
 * browser on a small copy of the photo, so it takes a few milliseconds.
 */
export async function autoFocus(photo: Blob): Promise<{ focus: Focus; width: number; height: number }> {
  const bitmap = await createImageBitmap(photo);
  const { width, height } = bitmap;
  const cols = 48;
  const rows = Math.max(12, Math.min(96, Math.round((cols * height) / width)));
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, cols, rows);
  bitmap.close();
  const px = ctx.getImageData(0, 0, cols, rows).data;

  const gray = new Float32Array(cols * rows);
  const sat = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    sat[i] = max === 0 ? 0 : (max - min) / max;
  }

  // Detail (edges) plus colour, nudged towards the centre.
  const scores: { i: number; s: number }[] = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const i = y * cols + x;
      const gx = gray[i + 1] - gray[i - 1];
      const gy = gray[i + cols] - gray[i - cols];
      const edge = Math.min(1, Math.hypot(gx, gy) / 120);
      const dx = x / cols - 0.5, dy = y / rows - 0.5;
      const centre = 1 - 0.45 * Math.hypot(dx, dy);
      scores.push({ i, s: (0.6 * edge + 0.4 * sat[i]) * centre });
    }
  }
  scores.sort((a, b) => b.s - a.s);
  const top = scores.slice(0, Math.max(1, Math.round(scores.length * 0.15)));
  let sx = 0, sy = 0, sw = 0;
  for (const { i, s } of top) {
    sx += (i % cols) * s;
    sy += Math.floor(i / cols) * s;
    sw += s;
  }
  if (sw === 0) return { focus: CENTER, width, height };
  // Keep a margin so the crop never hugs an edge too tightly.
  const x = Math.min(85, Math.max(15, ((sx / sw + 0.5) / cols) * 100));
  const y = Math.min(85, Math.max(15, ((sy / sw + 0.5) / rows) * 100));
  return { focus: focusOf(x, y), width, height };
}
