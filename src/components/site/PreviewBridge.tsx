"use client";

import { useEffect } from "react";

/*
 * Runs on customer pages when they're shown inside the Edit Website live
 * preview. It receives draft text from the dashboard and shows it in place,
 * as plain text only, without saving anything. Outside the preview it does
 * nothing.
 */

type PreviewMessage = {
  type: "ico-preview";
  texts: Record<string, string>;
  /** Website photo key → the photo to show (saved, or a new upload not saved yet). */
  images?: Record<string, string>;
  vars: { phone: string; cuisine: string };
  focus?: string;
};

const STYLE = `
[data-preview-focus] { outline: 2px solid #b4832f; outline-offset: 4px; border-radius: 2px; }
/* Photos often fill the page width, so their outline goes inside the edge. */
[data-preview-focus]:has(> img[data-image-key]) { outline-offset: -4px; }
[data-text-key]:has(> [data-text-preview] > .block) { display: block; }
`;

function render(target: HTMLElement, text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  target.replaceChildren(
    ...(lines.length <= 1
      ? [document.createTextNode(lines[0] ?? "")]
      : lines.map((l) => {
          const s = document.createElement("span");
          s.className = "block";
          s.textContent = l;
          return s;
        })),
  );
}

/**
 * Centres an element in the preview. Scrolls only this page (scrollIntoView
 * would also scroll the dashboard around the preview), plus the sideways
 * gallery rail when the element sits in it.
 */
function reveal(el: Element) {
  const r = el.getBoundingClientRect();
  window.scrollTo({ top: window.scrollY + r.top - (window.innerHeight - r.height) / 2, behavior: "smooth" });
  const rail = el.closest<HTMLElement>(".overflow-x-auto");
  if (rail) {
    const box = rail.getBoundingClientRect();
    rail.scrollTo({ left: rail.scrollLeft + r.left - box.left - (box.width - r.width) / 2, behavior: "smooth" });
  }
}

function apply(msg: PreviewMessage, scroll: boolean) {
  const fill = (s: string) =>
    s.replaceAll("{phone}", msg.vars.phone).replaceAll("{cuisine}", msg.vars.cuisine);

  document.querySelectorAll<HTMLElement>("[data-text-key]").forEach((el) => {
    const key = el.dataset.textKey!;
    const draft = msg.texts[key];
    const orig = el.querySelector<HTMLElement>(":scope > [data-text-orig]");
    if (!orig || draft === undefined) return;

    let shown = el.querySelector<HTMLElement>(":scope > [data-text-preview]");
    if (!shown) {
      shown = document.createElement("span");
      shown.dataset.textPreview = "";
      el.appendChild(shown);
    }
    orig.hidden = true;
    render(shown, fill(draft));

    if (key === msg.focus) el.setAttribute("data-preview-focus", "");
    else el.removeAttribute("data-preview-focus");
  });

  // Photos: show the draft in place. The browser's responsive versions of
  // the saved photo are dropped so the draft is what loads.
  document.querySelectorAll<HTMLImageElement>("img[data-image-key]").forEach((im) => {
    const key = im.dataset.imageKey!;
    const url = msg.images?.[key];
    if (url && im.dataset.previewSrc !== url) {
      im.removeAttribute("srcset");
      im.src = url;
      im.dataset.previewSrc = url;
    }
    const box = im.parentElement;
    if (!box) return;
    if (key === msg.focus) box.setAttribute("data-preview-focus", "");
    else box.removeAttribute("data-preview-focus");
  });

  const focused =
    scroll &&
    msg.focus &&
    document.querySelector(
      `[data-text-key="${CSS.escape(msg.focus)}"], img[data-image-key="${CSS.escape(msg.focus)}"]`,
    );
  if (focused) reveal(focused.matches("img") ? (focused.parentElement ?? focused) : focused);
}

export function PreviewBridge() {
  useEffect(() => {
    if (window.self === window.top) return;

    const style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    let last: PreviewMessage | null = null;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "ico-preview") return;
      last = e.data as PreviewMessage;
      apply(last, true);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "ico-preview-ready" }, window.location.origin);

    // Client-side updates can re-add the saved text; keep the draft showing.
    const observer = new MutationObserver(() => {
      if (last) {
        observer.disconnect();
        apply(last, false);
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("message", onMessage);
      observer.disconnect();
      style.remove();
    };
  }, []);

  return null;
}
