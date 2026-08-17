import type { ReactNode } from "react";

export function OverlayHost({ children }: { children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-40"
      data-omni-overlay-host="true"
      aria-live="polite"
    >
      <div className="pointer-events-auto contents">{children}</div>
    </div>
  );
}
