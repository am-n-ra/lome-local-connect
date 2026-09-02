import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/omni/NotificationsBell";
import { cn } from "@/lib/utils";

export function OmniMapChrome({
  onMenuOpen,
  menuBadge,
  left,
  children,
  className,
}: {
  onMenuOpen: () => void;
  menuBadge?: number;
  left?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("pointer-events-none absolute inset-x-0 top-0 z-50", className)}
      data-omni-map-chrome="true"
    >
      <div className="flex items-start justify-between gap-3 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:px-5 md:pt-5">
        <div className="pointer-events-auto min-w-0">{left}</div>
        <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
          {children}
          <div className="omni-glass pointer-events-auto shrink-0 rounded-full p-1">
            <NotificationsBell />
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Ouvrir le menu"
            className="omni-glass pointer-events-auto relative h-11 w-11 shrink-0 rounded-full border-foreground/10 bg-card/82"
            onClick={onMenuOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            {menuBadge != null && menuBadge > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {menuBadge > 99 ? "99+" : menuBadge}
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </header>
  );
}
