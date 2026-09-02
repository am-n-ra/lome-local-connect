import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OmniMapShell({
  map,
  children,
  chrome,
  className,
  label = "Espace cartographique Omni",
}: {
  map: ReactNode;
  children?: ReactNode;
  chrome?: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("relative h-[100dvh] overflow-hidden bg-[var(--atlas-paper)] omni-atlas-ink", className)}
      data-omni-map-shell="true"
      data-omni-map-first="true"
      aria-label={label}
    >
      <div className="absolute inset-0 z-0" data-omni-map-canvas="true">
        {map}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10" data-omni-map-overlays="true">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--atlas-paper)]/45 to-transparent" aria-hidden="true" />
        {children}
      </div>
      {chrome}
    </div>
  );
}
