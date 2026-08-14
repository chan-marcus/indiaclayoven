"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/format";

/**
 * "4 min ago", rendered on the client only.
 *
 * The server and the browser render at different moments, so computing this
 * during SSR produces a hydration mismatch. Rendering after mount also lets
 * the order board tick along on its own during service.
 */
export function RelativeTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setText(relativeTime(iso));
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [iso]);

  // Reserve the space so the row doesn't jump when the label appears.
  return <span suppressHydrationWarning>{text ?? " "}</span>;
}
