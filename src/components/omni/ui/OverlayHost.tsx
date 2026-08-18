import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OverlayHost({
  children,
  placement = "free",
  className,
}: {
  children: ReactNode;
  placement?: "free" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-40",
        placement === "center" &&
          "grid place-items-center px-3 py-[max(4.5rem,env(safe-area-inset-top)+1rem)]",
        className,
      )}
      data-omni-overlay-host="true"
      data-omni-overlay-placement={placement}
      aria-live="polite"
    >
      <div className="pointer-events-auto contents">{children}</div>
    </div>
  );
}
