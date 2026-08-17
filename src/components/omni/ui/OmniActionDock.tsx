import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type OmniActionItem = {
  value: string;
  label: string;
  shortLabel?: string;
  icon?: ReactNode;
  count?: number;
};

export function OmniActionDock({
  items,
  active,
  onChange,
  className,
  placement = "floating",
}: {
  items: OmniActionItem[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
  placement?: "floating" | "inline";
}) {
  const placementClass =
    placement === "inline"
      ? "relative z-20 mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto rounded-2xl p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:items-center"
      : "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 mx-auto flex w-[min(44rem,calc(100vw-1.5rem))] gap-1 overflow-x-auto rounded-2xl p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inset-x-auto sm:right-5 sm:top-1/2 sm:bottom-auto sm:translate-y-[-50%] sm:mx-0 sm:w-auto sm:max-w-[11rem] sm:flex-col sm:items-stretch";

  return (
    <nav
      aria-label="Actions principales"
      data-omni-action-dock={placement}
      className={cn("omni-glass pointer-events-auto", placementClass, className)}
    >
      {items.map((item) => {
        const selected = active === item.value;
        return (
          <button
            key={item.value}
            type="button"
            aria-current={selected ? "page" : undefined}
            aria-label={item.label}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.98] sm:justify-start",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card/80 hover:text-foreground",
            )}
          >
            {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
            <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
            <span className="hidden sm:inline">{item.label}</span>
            {item.count != null && item.count > 0 ? (
              <span
                className={cn(
                  "ml-auto rounded-full px-1.5 py-0.5 text-[9px]",
                  selected ? "bg-primary-foreground/20" : "bg-primary/12 text-primary",
                )}
              >
                {item.count > 99 ? "99+" : item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
