/* ============================================================================
   Omni v3 — named component library (shared foundation).
   Screens must reuse ONLY these components (SPEC §4.7). If a screen seems to
   need an unlisted component, reuse the closest one here.
   ========================================================================== */
import type { FormEvent, ReactNode, Ref } from 'react';
import { ArrowRight, MapPin, QrCode, Search, SlidersHorizontal, X } from 'lucide-react';
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
   SearchDock — pill ~92%, cream, search icon left, scan & filter icons right.
   ------------------------------------------------------------------------- */
export function SearchDock({
  query,
  onQuery,
  onSubmit,
  onFilters,
  onScanQr,
  filtersActive,
  inputRef,
}: {
  query: string;
  onQuery: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onFilters: () => void;
  onScanQr?: () => void;
  filtersActive?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <form className="search-pill" aria-label="Recherche Omni" onSubmit={onSubmit}>
      <Search size={17} aria-hidden="true" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Rechercher un commerce, un produit…"
        aria-label="Rechercher un commerce ou un produit"
      />
      {query.trim().length > 0 && (
        <button
          className="pill-submit"
          type="submit"
          aria-label="Lancer la recherche"
          title="Lancer la recherche"
        >
          <ArrowRight size={17} />
        </button>
      )}
      {onScanQr && (
        <button
          className="pill-qr"
          type="button"
          aria-label="Scanner le QR d’une facilité"
          title="Scanner un QR code"
          onClick={onScanQr}
        >
          <QrCode size={18} />
        </button>
      )}
      <button
        className="pill-options"
        type="button"
        aria-expanded={!!filtersActive}
        aria-controls="search-options"
        aria-label={filtersActive ? 'Fermer les filtres' : 'Ouvrir les filtres'}
        title="Filtres de recherche"
        onClick={onFilters}
      >
        <SlidersHorizontal size={18} />
      </button>
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
    <article className="v3-facility-card" onClick={onOpen} style={{ cursor: 'pointer' }}>
      <div className="v3-card-cover" aria-hidden="true">
        <MapPin size={26} />
        <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
      </div>
      <div className="v3-card-body">
        <div className="v3-card-name">{facility.name}</div>
        <div className="v3-card-meta">{facility.category || 'Lieu local'}{facility.productCount > 0 ? ` · ${facility.productCount} offre${facility.productCount === 1 ? '' : 's'}` : ''}</div>
        <div className="v3-card-foot">
          {price}
          <button className="v3-card-cta" type="button" onClick={(event) => { event.stopPropagation(); onVerify(); }}>{verifyLabel ?? (facility.productCount > 0 ? 'Vérifier' : 'Voir')}</button>
        </div>
      </div>
      <button className="sr-only" type="button" onClick={onOpen}>Ouvrir la fiche de {facility.name}</button>
    </article>
  );
}

/* ----------------------------------------------------------------------------
   FacilitySelectorChips — Rule 8 & Screen 19:
   If the account has >1 visible Facility in seller mode, a horizontal chip selector
   (one chip = one facility, label = facility name) appears just above the search dock.
   ------------------------------------------------------------------------- */
export function FacilitySelectorChips({
  facilities,
  selectedId,
  onSelect,
}: {
  facilities: Array<{ id: string; name: string }>;
  selectedId: string | null;
  onSelect: (facilityId: string) => void;
}) {
  if (!facilities || facilities.length <= 1) return null;
  return (
    <div className="v3-facility-selector-bar" role="tablist" aria-label="Vos points de vente">
      <div className="v3-facility-selector-scroll">
        {facilities.map((facility) => {
          const isSelected = facility.id === selectedId;
          return (
            <button
              key={facility.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`v3-facility-chip${isSelected ? ' active' : ''}`}
              onClick={() => onSelect(facility.id)}
            >
              <span className="v3-chip-dot" aria-hidden="true" />
              <span className="v3-chip-text">{facility.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   SellerCertificationProgress — Screen 18:
   ContextPanel on unconfirmed pin: "X/3 ventes tracées" progress bar.
   ------------------------------------------------------------------------- */
export function SellerCertificationProgress({ verifiedSalesCount = 0 }: { verifiedSalesCount: number }) {
  const current = Math.min(3, Math.max(0, verifiedSalesCount));
  const percent = Math.round((current / 3) * 100);
  return (
    <div className="v3-certification-card">
      <div className="v3-cert-head">
        <span className="v3-cert-title">Certification du point de vente</span>
        <span className="v3-cert-count">{current}/3 ventes tracées</span>
      </div>
      <div className="v3-cert-progress-track" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={3}>
        <div className="v3-cert-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="v3-cert-note">
        {current >= 3
          ? 'Facilité confirmée ! Le badge vert est actif et les 20 $ de bienvenue sont débloqués.'
          : `Encore ${3 - current} vente${3 - current > 1 ? 's' : ''} via QR code pour valider le statut Confirmé et débloquer les 20 $ de crédit.`}
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   NeutralLockedCreditBadge — Screen 21 & Rules 5 & 21:
   Welcome credit "20$ verrouillés jusqu'à confirmation" as a NEUTRAL badge (not orange).
   ------------------------------------------------------------------------- */
export function NeutralLockedCreditBadge({ amount = '20$' }: { amount?: string }) {
  return (
    <span className="v3-neutral-locked-badge">
      <span className="v3-locked-icon" aria-hidden="true">🔒</span>
      <span>{amount} verrouillés jusqu'à confirmation</span>
    </span>
  );
}

/* ----------------------------------------------------------------------------
   ConfirmationStepper — Screen 12:
   Vertical 4-step stepper (fullscreen/panel):
   1. Paiement envoyé -> 2. Paiement reçu -> 3. Produit envoyé / préparé -> 4. Produit reçu
   ------------------------------------------------------------------------- */
export function ConfirmationStepper({ currentStep }: { currentStep: 'payment_declared' | 'payment_confirmed' | 'fulfilment_pending' | 'fulfilled' | 'rated' }) {
  const steps = [
    { key: 'payment_declared', label: 'Paiement envoyé (Acheteur)', desc: 'Espèces ou Mobile Money déclaré' },
    { key: 'payment_confirmed', label: 'Paiement reçu (Vendeur)', desc: 'Vérifié et encaissé au comptoir' },
    { key: 'fulfilment_pending', label: 'Produit préparé / remis', desc: 'Prêt pour la remise physique' },
    { key: 'fulfilled', label: 'Produit reçu (Acheteur)', desc: 'Transaction validée et clôturée' },
  ];

  const stepOrder = ['payment_declared', 'payment_confirmed', 'fulfilment_pending', 'fulfilled', 'rated'];
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="v3-stepper-vertical" aria-label="Progression de la transaction">
      {steps.map((step, idx) => {
        const isDone = currentIndex > idx;
        const isCurrent = currentIndex === idx;
        return (
          <div key={step.key} className={`v3-step-item ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}>
            <div className="v3-step-marker" aria-hidden="true">
              <span className="v3-step-dot" />
              {idx < steps.length - 1 && <span className="v3-step-line" />}
            </div>
            <div className="v3-step-content">
              <strong className="v3-step-label">{step.label}</strong>
              <span className="v3-step-desc">{step.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   ReviewStars — Screen 13:
   5 Evergreen stars interactive rating component.
   ------------------------------------------------------------------------- */
export function ReviewStars({ score, onChange, readOnly }: { score: number; onChange?: (score: number) => void; readOnly?: boolean }) {
  return (
    <div className="v3-star-rating" role="radiogroup" aria-label="Notation de la transaction">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          role="radio"
          aria-checked={score === star}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          className={`v3-star-btn ${star <= score ? 'filled' : 'empty'}`}
          onClick={() => onChange?.(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   PaymentMethodSelector — Screen 11:
   ContextPanel / Sheet lists configured methods (cash, Mobile Money) with Evergreen radio.
   ------------------------------------------------------------------------- */
export function PaymentMethodSelector({
  selected,
  onSelect,
}: {
  selected: 'cash' | 'mobile_money';
  onSelect: (method: 'cash' | 'mobile_money') => void;
}) {
  return (
    <div className="v3-payment-options" role="radiogroup" aria-label="Modes de paiement">
      <button
        type="button"
        role="radio"
        aria-checked={selected === 'cash'}
        className={`v3-payment-row${selected === 'cash' ? ' active' : ''}`}
        onClick={() => onSelect('cash')}
      >
        <span className="v3-radio-bullet" aria-hidden="true" />
        <div className="v3-payment-info">
          <strong>Espèces au comptoir</strong>
          <span>Règlement direct en espèces sur place</span>
        </div>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={selected === 'mobile_money'}
        className={`v3-payment-row${selected === 'mobile_money' ? ' active' : ''}`}
        onClick={() => onSelect('mobile_money')}
      >
        <span className="v3-radio-bullet" aria-hidden="true" />
        <div className="v3-payment-info">
          <strong>Mobile Money</strong>
          <span>Transfert direct (Wave, Orange Money, MTN MoMo, Moov)</span>
        </div>
      </button>
    </div>
  );
}

