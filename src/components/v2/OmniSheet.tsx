import type { ReactNode } from "react";
import type { AsyncStatus } from "../../core/surface-state";

type Props = {
  title: string;
  status?: AsyncStatus;
  open?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  onBack?: () => void;
  onRetry?: () => void;
};

export function OmniSheet({ title, status = "ready", open = true, children, footer, onClose, onBack, onRetry }: Props) {
  if (!open) return null;
  return (
    <section className="omni-sheet" aria-label={title} role="dialog" aria-modal="false">
      <header className="omni-sheet__header">
        <button type="button" className="omni-sheet__icon" onClick={onBack} aria-label="Back" disabled={!onBack}>←</button>
        <div>
          <p className="omni-eyebrow">OMNI V2 · SURFACE</p>
          <h2>{title}</h2>
        </div>
        <button type="button" className="omni-sheet__icon" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div className="omni-sheet__body" aria-live="polite">
        {status === "loading" && <p className="omni-state">Loading…</p>}
        {status === "empty" && <p className="omni-state">Nothing to show yet.</p>}
        {status === "error" && <div className="omni-state"><p>Something went wrong.</p><button type="button" onClick={onRetry}>Retry</button></div>}
        {status !== "loading" && status !== "empty" && status !== "error" && children}
      </div>
      {footer && <footer className="omni-sheet__footer">{footer}</footer>}
    </section>
  );
}
