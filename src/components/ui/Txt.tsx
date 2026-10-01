import type { TextKey } from "@/lib/site-text";
import { Lines } from "@/components/ui/Lines";

/**
 * Owner-editable text, tagged with its key so the Edit Website live preview
 * can find it. The preview hides the inner span and adds its own copy next to
 * it, so React's own nodes are never touched.
 */
export function Txt({ k, text, children }: { k: TextKey; text: string; children?: React.ReactNode }) {
  return (
    <span data-text-key={k}>
      <span data-text-orig>{children ?? <Lines text={text} />}</span>
    </span>
  );
}
