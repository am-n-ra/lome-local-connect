import type { ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function OmniSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "bottom",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "bottom" | "right";
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "omni-sheet flex max-h-[min(88dvh,48rem)] flex-col overflow-hidden rounded-t-[1.75rem] p-0 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[1.5rem]",
          side === "right" &&
            "h-full max-h-full w-[min(92vw,32rem)] rounded-l-[1.5rem] rounded-t-none",
          className,
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30 sm:hidden" />
        <SheetHeader className="shrink-0 border-b border-border/70 px-5 pb-4 pt-4 text-left">
          <SheetTitle className="font-display text-xl">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
        {footer ? (
          <SheetFooter className="omni-safe-bottom shrink-0 border-t border-border/70 bg-card/90 px-5 pb-3 pt-3 backdrop-blur-md">
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function OmniSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function OmniEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="omni-card grid min-h-36 place-items-center p-6 text-center">
      <div>
        <p className="font-display font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

export function OmniStatCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "default" | "positive" | "warning";
}) {
  return (
    <div className="omni-card min-w-0 p-4">
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 truncate font-display text-2xl font-extrabold",
          tone === "positive" && "text-forest",
          tone === "warning" && "text-primary",
        )}
      >
        {value}
      </p>
      {detail ? <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function OmniStatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        tone === "positive" && "bg-forest/12 text-forest",
        tone === "warning" && "bg-primary/12 text-primary",
        tone === "danger" && "bg-destructive/12 text-destructive",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function OmniStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Progression">
      {steps.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                complete && "bg-forest text-forest-foreground",
                active && "bg-primary text-primary-foreground",
                !complete && !active && "bg-muted text-muted-foreground",
              )}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-[11px] font-semibold sm:block",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function OmniLoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}

export function OmniDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border/70 bg-card/70">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border/60 px-4 py-4">{children}</div>
    </details>
  );
}
