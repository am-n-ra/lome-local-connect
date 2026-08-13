import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("omni-glass p-4", className)} {...props} />;
}

export function GlassPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("omni-panel", className)} {...props} />;
}

const omniButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--omni-radius-pill)] text-sm font-semibold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        glow: "omni-button-glow text-primary-foreground hover:-translate-y-0.5",
        glass:
          "border border-white/45 bg-white/55 text-foreground shadow-[var(--omni-shadow-glass)] backdrop-blur-[var(--omni-blur-md)] hover:bg-white/70",
        quiet: "bg-transparent text-foreground hover:bg-foreground/5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "glow", size: "default" },
  },
);

export interface OmniButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof omniButtonVariants> {
  asChild?: boolean;
}

export const OmniButton = React.forwardRef<HTMLButtonElement, OmniButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(omniButtonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
OmniButton.displayName = "OmniButton";

type LiveStatusProps = {
  online?: boolean;
  label?: string;
  detail?: string;
  className?: string;
};

export function LiveStatus({ online = false, label, detail, className }: LiveStatusProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-white/55 px-3 py-1.5 text-xs font-semibold shadow-[var(--omni-shadow-glass)] backdrop-blur-[var(--omni-blur-sm)]",
        online ? "border-forest/30 text-forest" : "border-border text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex h-2.5 w-2.5 rounded-full",
          online ? "bg-forest" : "bg-muted-foreground/55",
        )}
      >
        {online && <span className="absolute inset-0 animate-ping rounded-full bg-forest/60" />}
      </span>
      <span>{label ?? (online ? "En direct" : "Hors ligne")}</span>
      {detail && <span className="font-normal opacity-75">· {detail}</span>}
    </div>
  );
}

type MapBottomSheetProps = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  title?: string;
  onClose?: () => void;
};

export function MapBottomSheet({
  open = true,
  title,
  onClose,
  className,
  children,
  ...props
}: MapBottomSheetProps) {
  if (!open) return null;
  return (
    <div className={cn("omni-bottom-sheet", className)} {...props}>
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-foreground/15 md:hidden" />
      {(title || onClose) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-bold">{title}</h2>}
          {onClose && (
            <OmniButton
              variant="quiet"
              size="icon"
              aria-label="Fermer"
              onClick={onClose}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </OmniButton>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
