/* ============================================================================
   Omni v3 — named component library (shared foundation).
   Screens must reuse ONLY these components (SPEC §4.7). If a screen seems to
   need an unlisted component, reuse the closest one here.
   ========================================================================== */
import type { FormEvent, ReactNode, Ref } from 'react';
import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import type { PublicFacility } from './types';

export type StatusVariant = 'available' | 'confirmed' | 'unconfirmed' | 'unclaimed';

/** Discount percentage for a product (v3 %réduction — mandatory on every product). */
export function discountPercent(p: { pourcentageReduction?: number | null; prixOriginal?: number; prixReduit?: number }): number | null {
  if (typeof p.pourcentageReduction === 'number' && p.pourcentageReduction > 0) return Math.round(p.pourcentageReduction);
  if (typeof p.prixOriginal === 'number' && typeof p.prixReduit === 'number' && p.prixOriginal > 0 && p.prixReduit < p.prixOriginal) {
    return Math.max(1, Math.round((1 - p.prixReduit / p.prixOriginal) * 100));
  }
  return null;
}

/** Map a facility trust + catalogue state to a rule-6 StatusBadge variant. */
export function facilityStatus(f: { trust: string; productCount: number }): { variant: StatusVariant; label: string } {
  if (f.trust === 'confirmed') return f.productCount > 0 ? { variant: 'confirmed', label: 'Disponible' } : { variant: 'confirmed', label: 'Confirmée' };
  if (f.trust === 'unconfirmed' || f.trust === 'certified') return { variant: 'unconfirmed', label: 'À confirmer' };
  return { variant: 'unclaimed', label: 'Non revendiqué' };
}

/* ----------------------------------------------------------------------------
   MenuIcon — 48px Cream circle, Evergreen icon, fixed top-right.
   ------------------------------------------------------------------------- */
export function MenuIcon({ initials, onClick, label = 'Ouvrir le menu Omni', expanded }: { initials: string; onClick: () => void; label?: string; expanded?: boolean }) {
  return (
    <button type="button" className="menu-icon" aria-label={label} aria-expanded={expanded} aria-haspopup="menu" aria-controls="omni-menu" onClick={onClick}>
      {initials}
    </button>
  );
}

/* ----------------------------------------------------------------------------
   RoleSwitch — "Acheter / Vendre" pill, fixed top-left. Never merged with menu.
   ------------------------------------------------------------------------- */
export function RoleSwitch({ role, onBuyer, onSeller }: { role: 'buyer' | 'seller'; onBuyer: () => void; onSeller: () => void }) {
  return (
    <div className="role-switch" aria-label="Contexte de rôle Omni">
      <button type="button" className={`role-option${role === 'buyer' ? ' active' : ''}`} aria-current={role === 'buyer' ? 'page' : undefined} onClick={onBuyer}>Acheter</button>
      <button type="button" className={`role-option${role === 'seller' ? ' active' : ''}`} aria-current={role === 'seller' ? 'page' : undefined} onClick={onSeller}>Vendre</button>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   SearchDock — pill ~92%, cream, search icon left, filter icon right.
   ------------------------------------------------------------------------- */
export function SearchDock({ query, onQuery, onSubmit, onFilters, filtersActive, inputRef }: { query: string; onQuery: (v: string) => void; onSubmit: (e: FormEvent) => void; onFilters: () => void; filtersActive?: boolean; inputRef?: Ref<HTMLInputElement> }) {
  return (
    <form className="search-pill" aria-label="Recherche Omni" onSubmit={onSubmit}>
      <Search size={17} aria-hidden="true" />
      <input ref={inputRef} value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Rechercher un commerce, un produit…" aria-label="Rechercher un commerce ou un produit" />
      <button className="pill-options" type="button" aria-expanded={!!filtersActive} aria-controls="search-options" aria-label={filtersActive ? 'Fermer les filtres' : 'Ouvrir les filtres'} onClick={onFilters}><SlidersHorizontal size={18} /></button>
    </form>
  );
}

/* ----------------------------------------------------------------------------
   ContextPanel — floating card anchored above the selected pin (rule 3).
   ------------------------------------------------------------------------- */
export function ContextPanel({ title, category, meta, onVerify, onOpen, onClose }: { title: string; category?: string | null; meta?: string; onVerify: () => void; onOpen: () => void; onClose: () => void }) {
  return (
    <div className="context-panel" role="dialog" aria-label={title}>
      <span className="context-notch" aria-hidden="true" />
      <button type="button" className="context-close" aria-label="Fermer" onClick={onClose}><X size={16} /></button>
      <div className="context-head">
        <div>
          <h3 className="context-title">{title}</h3>
          <div className="context-meta">{category || 'Lieu local'}{meta ? ` · ${meta}` : ''}</div>
        </div>
      </div>
      <div className="context-actions">
        <button className="primary-button" type="button" onClick={onVerify}>Vérifier la disponibilité</button>
        <button className="context-outline" type="button" onClick={onOpen}>Voir la facilité</button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   StatusBadge — rule 6 colors. Uppercase Hanken 700 label.
   ------------------------------------------------------------------------- */
export function StatusBadge({ variant, children }: { variant: StatusVariant; children: ReactNode }) {
  return <span className={`v3-status ${variant}`}>{children}</span>;
}

/* ----------------------------------------------------------------------------
   PriceBadge — "-XX%" orange pill only (rule 5). Never an absolute amount.
   ------------------------------------------------------------------------- */
export function PriceBadge({ percent }: { percent: number }) {
  return <span className="v3-price">-{percent}%</span>;
}

/* ----------------------------------------------------------------------------
   FilterChip — pill; inactive Cream + Evergreen border, active Evergreen.
   ------------------------------------------------------------------------- */
export function FilterChip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`v3-chip${active ? ' active' : ''}`} aria-pressed={!!active} onClick={onClick}>
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------------------
   FacilityCard — results grid card: 24px radius, 12px image, StatusBadge
   overlay, name / category / distance, discounted price w/ PriceBadge.
   ------------------------------------------------------------------------- */
export function FacilityCard({ facility, badge, onOpen, onVerify, price, verifyLabel }: { facility: PublicFacility; badge: { variant: StatusVariant; label: string }; onOpen: () => void; onVerify: () => void; price?: ReactNode; verifyLabel?: string }) {
  return (
    <article className="v3-facility-card">
      <div className="v3-card-cover" aria-hidden="true">
        <MapPin size={26} />
        <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
      </div>
      <div className="v3-card-body">
        <div className="v3-card-name">{facility.name}</div>
        <div className="v3-card-meta">{facility.category || 'Lieu local'}{facility.productCount > 0 ? ` · ${facility.productCount} offre${facility.productCount === 1 ? '' : 's'}` : ''}</div>
        <div className="v3-card-foot">
          {price}
          <button className="v3-card-cta" type="button" onClick={onVerify}>{verifyLabel ?? (facility.productCount > 0 ? 'Vérifier' : 'Voir')}</button>
        </div>
      </div>
      <button className="sr-only" type="button" onClick={onOpen}>Ouvrir la fiche de {facility.name}</button>
    </article>
  );
}
