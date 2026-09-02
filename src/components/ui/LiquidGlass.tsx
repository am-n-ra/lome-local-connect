import React, { ReactNode } from 'react';

/**
 * Liquid Glass UI Primitives
 * Conçu pour un rendu optique haut de gamme, fluide et mobile-first.
 */

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevation?: 'flat' | 'low' | 'high' | 'floating';
  interactive?: boolean;
  className?: string;
  id?: string;
}

export function GlassSurface({
  children,
  elevation = 'low',
  interactive = false,
  className = '',
  id,
  ...rest
}: GlassSurfaceProps) {
  const elevationStyles = {
    flat: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-none',
    low: 'bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]',
    high: 'bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_12px_36px_-4px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.04)]',
    floating: 'bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_48px_-6px_rgba(0,0,0,0.16),0_8px_16px_-4px_rgba(0,0,0,0.06)]',
  };

  const interactiveStyles = interactive
    ? 'transition-all duration-200 active:scale-[0.985] hover:bg-white/95 cursor-pointer'
    : '';

  return (
    <div
      id={id}
      className={`rounded-2xl ${elevationStyles[elevation]} ${interactiveStyles} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children: ReactNode;
  id?: string;
}

export function GlassButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  id,
  ...rest
}: GlassButtonProps) {
  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs gap-1.5 font-medium rounded-xl',
    md: 'h-11 px-5 text-sm gap-2 font-medium rounded-xl min-h-[44px]',
    lg: 'h-13 px-6 text-base gap-2.5 font-semibold rounded-2xl min-h-[52px]',
    icon: 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center p-0',
  };

  const variantStyles = {
    primary: 'bg-[#234D40] text-white hover:bg-[#1A3B31] active:bg-[#122A23] shadow-[0_2px_8px_rgba(35,77,64,0.25)] border border-[#234D40]',
    secondary: 'bg-white/80 text-[#1A1C1B] hover:bg-white active:bg-white/90 border border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md',
    accent: 'bg-[#F08F5A] text-white hover:bg-[#E07D48] active:bg-[#CC6D3A] shadow-[0_2px_8px_rgba(240,143,90,0.25)] border border-[#F08F5A]',
    ghost: 'bg-transparent text-[#1A1C1B] hover:bg-black/5 active:bg-black/10 border-transparent',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:bg-red-200',
  };

  return (
    <button
      id={id}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center select-none whitespace-nowrap transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

interface GlassBadgeProps {
  variant?: 'emerald' | 'amber' | 'coral' | 'slate' | 'pro';
  children: ReactNode;
  className?: string;
  id?: string;
}

export function GlassBadge({
  variant = 'slate',
  children,
  className = '',
  id,
}: GlassBadgeProps) {
  const badgeStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    coral: 'bg-[#F08F5A]/15 text-[#C0602E] border-[#F08F5A]/30',
    slate: 'bg-black/5 text-slate-700 border-black/10',
    pro: 'bg-gradient-to-r from-emerald-600/15 to-teal-600/15 text-emerald-900 border-emerald-600/30 font-semibold',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border backdrop-blur-md whitespace-nowrap ${badgeStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface GlassBottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  id?: string;
}

export function GlassBottomDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = '',
  headerAction,
  id,
}: GlassBottomDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      id={id ? `${id}-backdrop` : undefined}
      className="fixed inset-0 z-[70] pointer-events-auto flex flex-col justify-end bg-black/30 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id={id}
        className={`w-full max-w-xl mx-auto bg-white/95 backdrop-blur-2xl border-t border-x border-white/80 rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] max-h-[85dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 ${className}`}
      >
        {/* Drag handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1.5 bg-black/15 rounded-full" />
        </div>

        {(title || headerAction) && (
          <div className="px-5 py-3 border-b border-black/[0.06] flex items-center justify-between gap-3">
            <div>
              {typeof title === 'string' ? (
                <h3 className="font-display font-semibold text-lg text-[#1A1C1B] tracking-tight">{title}</h3>
              ) : (
                title
              )}
              {subtitle && <div className="text-xs text-black/60 mt-0.5">{subtitle}</div>}
            </div>
            {headerAction}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
