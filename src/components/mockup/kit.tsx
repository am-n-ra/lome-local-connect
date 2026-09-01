import type { ReactNode } from "react";

export const FCFA = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  return (
    <div className="flex h-full flex-col bg-background">
      {title ? (
        <header className="shrink-0 border-b border-border/70 bg-card/80 px-4 pb-3 pt-4 backdrop-blur">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </header>
      ) : null}
      <div className={`flex-1 ${scroll ? "overflow-y-auto" : "overflow-hidden"} p-4`}>{children}</div>
    </div>
  );
}

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border/70 bg-card p-3 shadow-[var(--shadow-soft)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Btn({
  children,
  variant = "primary",
  full = true,
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "forest" | "outline";
  full?: boolean;
  onClick?: () => void;
}) {
  const styles: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    forest: "bg-forest text-forest-foreground",
    outline: "border border-border bg-card text-foreground",
    ghost: "bg-secondary text-secondary-foreground",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${full ? "w-full" : ""} rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "forest" | "gold" | "primary" | "danger";
}) {
  const tones: Record<string, string> = {
    muted: "bg-secondary text-secondary-foreground",
    forest: "bg-forest/12 text-forest",
    gold: "bg-gold/25 text-accent-foreground",
    primary: "bg-primary/12 text-primary",
    danger: "bg-destructive/12 text-destructive",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Row({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      {value ? <div className="shrink-0 text-sm text-muted-foreground">{value}</div> : null}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground first:mt-0">
      {children}
    </h3>
  );
}

export function MapBackdrop({ children }: { children?: ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 10%, oklch(0.985 0.01 120) 0%, oklch(0.95 0.02 130) 55%, oklch(0.9 0.03 150) 100%)",
        }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 300 600" preserveAspectRatio="none">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 60} x2="300" y2={i * 60 + 20} stroke="oklch(0.86 0.02 140)" strokeWidth="1.2" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 45} y1="0" x2={i * 45 + 30} y2="600" stroke="oklch(0.88 0.02 140)" strokeWidth="1.2" />
        ))}
        <path d="M0 380 L300 300" stroke="oklch(0.82 0.03 120)" strokeWidth="8" opacity="0.5" />
      </svg>
      {children}
    </div>
  );
}

export function Pin({
  x,
  y,
  tone = "primary",
  label,
}: {
  x: number;
  y: number;
  tone?: "primary" | "forest" | "muted";
  label?: string;
}) {
  const bg = tone === "primary" ? "bg-primary" : tone === "forest" ? "bg-forest" : "bg-muted-foreground";
  return (
    <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className={`flex items-center gap-1 rounded-full ${bg} px-2 py-1 text-[10px] font-bold text-white shadow-lg`}>
        <span className="block h-1.5 w-1.5 rounded-full bg-white/90" />
        {label}
      </div>
      <div className={`mx-auto h-2 w-2 -translate-y-0.5 rotate-45 ${bg}`} />
    </div>
  );
}

export function UserDot({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
      <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-forest/25" />
      <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-white bg-forest shadow" />
    </div>
  );
}

export function TabBar({ items, active }: { items: string[]; active: string }) {
  return (
    <nav className="shrink-0 border-t border-border/70 bg-card/95 px-2 py-2 backdrop-blur">
      <ul className="flex items-center justify-between">
        {items.map((item) => (
          <li
            key={item}
            className={`flex-1 rounded-lg px-1 py-1 text-center text-[10px] font-semibold ${
              item === active ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold ${
        on ? "border-forest bg-forest text-forest-foreground" : "border-border bg-card text-transparent"
      }`}
    >
      ✓
    </span>
  );
}

export function Media({ label = "Photo vitrine", h = "h-32" }: { label?: string; h?: string }) {
  return (
    <div
      className={`${h} w-full overflow-hidden rounded-2xl border border-border/60`}
      style={{ background: "var(--gradient-warm)" }}
    >
      <div className="flex h-full w-full items-end bg-black/10 p-3">
        <span className="text-xs font-semibold text-white/90">{label}</span>
      </div>
    </div>
  );
}

export function QrArt({ size = 132 }: { size?: number }) {
  const cells = 11;
  return (
    <div className="rounded-2xl border border-border bg-white p-3">
      <div
        className="grid gap-[2px]"
        style={{ width: size, height: size, gridTemplateColumns: `repeat(${cells}, 1fr)` }}
      >
        {Array.from({ length: cells * cells }).map((_, i) => {
          const r = Math.floor(i / cells);
          const c = i % cells;
          const corner = (r < 3 && c < 3) || (r < 3 && c > cells - 4) || (r > cells - 4 && c < 3);
          const on = corner || (r * 7 + c * 5 + ((r * c) % 3)) % 3 === 0;
          return <span key={i} className={on ? "bg-foreground" : "bg-transparent"} />;
        })}
      </div>
    </div>
  );
}
