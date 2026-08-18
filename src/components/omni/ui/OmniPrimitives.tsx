import { AlertCircle, ArrowRight, Check, ChevronDown, Clock3, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { deriveProgressStatus } from "@/lib/transaction-progress";
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
  side = "center",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "bottom" | "right" | "center";
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
          side === "center" && "max-h-[min(88dvh,48rem)] p-0 sm:max-h-[calc(100dvh-2rem)]",
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

export function OmniGlassCard({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Component className={cn("omni-glass min-w-0", className)}>{children}</Component>;
}

export function OmniFloat({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("omni-glass pointer-events-auto", className)}>{children}</div>;
}

export function OmniSheetSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("omni-sheet min-w-0 rounded-[1.5rem]", className)}>{children}</div>;
}

export function OmniCenteredPanel({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      className={cn(
        "pointer-events-auto absolute left-1/2 top-1/2 flex max-h-[min(88dvh,48rem)] w-[min(calc(100vw-1.5rem),42rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.5rem] omni-sheet",
        className,
      )}
      aria-labelledby={labelledBy}
    >
      {children}
    </section>
  );
}

export function OmniPageSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("omni-page min-w-0", className)}>{children}</div>;
}

export function OmniActionFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "omni-safe-bottom flex shrink-0 flex-wrap items-center gap-2 border-t border-border/70 bg-card/95 px-4 pb-3 pt-3 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
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

export function OmniErrorState({
  title = "Impossible de charger cette surface",
  description = "Vérifiez votre connexion puis réessayez.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="omni-card grid min-h-36 place-items-center p-6 text-center">
      <div>
        <AlertCircle className="mx-auto h-5 w-5 text-destructive" aria-hidden="true" />
        <p className="mt-2 font-display font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {onRetry ? (
          <button
            type="button"
            className="mt-4 rounded-full border border-border px-4 py-2 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onRetry}
          >
            Réessayer
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function OmniSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} aria-hidden="true" />;
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

export type OmniProgressStatus =
  "upcoming" | "active" | "complete" | "blocked" | "expired" | "error";

export type OmniProgressStep = {
  label: string;
  description?: string;
  status?: OmniProgressStatus;
};

function progressIcon(status: OmniProgressStatus) {
  if (status === "complete") return <Check className="h-4 w-4" aria-hidden="true" />;
  if (status === "error" || status === "expired") {
    return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
  }
  if (status === "active") return <Clock3 className="h-4 w-4" aria-hidden="true" />;
  return null;
}

export function TransactionProgress({
  steps,
  current,
  statuses,
  ariaLabel = "Progression de transaction",
}: {
  steps: OmniProgressStep[] | string[];
  current: number;
  statuses?: OmniProgressStatus[];
  ariaLabel?: string;
}) {
  const normalized = steps.map((step, index) => {
    const fallbackStatus = deriveProgressStatus(index, current) as OmniProgressStatus;
    const value = typeof step === "string" ? { label: step } : step;
    return { ...value, status: statuses?.[index] ?? value.status ?? fallbackStatus };
  });

  return (
    <ol
      className="grid gap-2 sm:flex sm:items-start sm:gap-1"
      aria-label={ariaLabel}
      data-omni-progress="transaction"
    >
      {normalized.map((step, index) => {
        const status = step.status!;
        const active = status === "active";
        const icon = progressIcon(status);
        return (
          <li
            key={`${step.label}-${index}`}
            className="flex min-w-0 items-start gap-3 sm:flex-1 sm:flex-col sm:items-center sm:gap-1.5 sm:text-center"
            aria-current={active ? "step" : undefined}
            data-omni-progress-status={status}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:w-full sm:flex-col sm:items-center sm:gap-1.5">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-1 ring-inset transition-colors",
                  status === "complete" && "bg-forest text-forest-foreground ring-forest/30",
                  status === "active" && "bg-primary text-primary-foreground ring-primary/30",
                  status === "upcoming" && "bg-muted text-muted-foreground ring-border",
                  status === "blocked" && "bg-muted text-muted-foreground ring-border",
                  status === "expired" && "bg-primary/15 text-primary ring-primary/35",
                  status === "error" && "bg-destructive/12 text-destructive ring-destructive/35",
                )}
                aria-hidden="true"
              >
                {icon ?? (status === "blocked" ? "–" : index + 1)}
              </span>
              <span className="min-w-0 flex-1 sm:w-full">
                <span
                  className={cn(
                    "block break-words text-xs font-bold leading-tight",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {step.description ? (
                  <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">
                    {step.description}
                  </span>
                ) : null}
                <span className="sr-only">
                  {status === "complete"
                    ? "terminée"
                    : status === "active"
                      ? "active"
                      : status === "blocked"
                        ? "bloquée"
                        : status === "expired"
                          ? "expirée"
                          : status === "error"
                            ? "en erreur"
                            : "à venir"}
                </span>
              </span>
            </div>
            {index < normalized.length - 1 ? (
              <ArrowRight
                className="mt-2 hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/45 sm:block"
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Compatibility wrapper while buyer availability migrates to TransactionProgress. */
export function OmniStepper({ steps, current }: { steps: string[]; current: number }) {
  return <TransactionProgress steps={steps} current={current} />;
}

export function OmniLoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-sm text-muted-foreground"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

export function OmniDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border/70 bg-card/70">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span>{title}</span>
        <ChevronDown
          className="h-4 w-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border/60 px-4 py-4">{children}</div>
    </details>
  );
}
