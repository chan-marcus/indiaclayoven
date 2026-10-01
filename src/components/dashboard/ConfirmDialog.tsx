"use client";

/**
 * Asks before anything in the dashboard that removes or throws away work.
 * The confirm button is red; cancelling (or clicking outside) changes nothing.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep it",
  onCancel,
  onConfirm,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="Cancel" onClick={onCancel} className="absolute inset-0 animate-fade-in bg-ink/45" />
      <div className="relative w-full max-w-sm animate-rise rounded-sm bg-cream p-6">
        <h2 className="font-display text-xl text-balance">{title}</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-500">{body}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn btn-secondary flex-1 whitespace-nowrap">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn flex-1 bg-danger whitespace-nowrap text-cream hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
