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
      className={cn("relative h-[100dvh] overflow-hidden bg-background", className)}
      data-omni-map-shell="true"
      data-omni-map-first="true"
      aria-label={label}
    >
      <div className="absolute inset-0 z-0" data-omni-map-canvas="true">
        {map}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10" data-omni-map-overlays="true">
        {children}
      </div>
      {chrome}
    </div>
  );
}
