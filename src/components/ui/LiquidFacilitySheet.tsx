import { MapPin } from 'lucide-react';
import type { FacilityDetail, PublicProduct } from '../../trunk/types';

interface Props {
  facility: FacilityDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestAvailability: (facility: FacilityDetail, selectedProductIds: string[]) => void;
  onShowRoute?: (facility: FacilityDetail) => void;
  onClaim?: (facility: FacilityDetail) => void;
  onCreateFacility?: () => void;
  selectedIds?: string[];
  onToggleProduct?: (productId: string) => void;
}

const currency = (minor: number, ccy: string) => {
  const major = Math.round(minor / 100);
  return `${major.toLocaleString('fr-FR')} ${ccy || 'XOF'}`;
};

// Maquette FACILITY sheet (.sheet h-full) — exact match with accepted Species gate
// V1.1: selection persisted per-facility by parent (SELECTIONS[facId])
export function LiquidFacilitySheet({ facility, isOpen, onClose, onRequestAvailability, onClaim, onCreateFacility, selectedIds: parentIds, onToggleProduct }: Props) {
  if (!facility || !isOpen) return null;

  const isConfirmed = facility.trust === 'confirmed';
  const isUnclaimed = facility.trust === 'unclaimed';
  const products: PublicProduct[] = facility.products || [];
  const selectedIds = parentIds ?? [];
  const selCount = selectedIds.length;

  const toggle = (id: string) => { onToggleProduct?.(id); };

  const trustLabel = isConfirmed ? 'Vérifié' : isUnclaimed ? 'Non revendiquée' : 'À valider';
  const trustClass = isConfirmed ? 'ok' : isUnclaimed ? 'dash' : 'gray';

  return (
    <section className="omni-sheet omni-sheet-enter context-sheet" role="dialog" aria-modal="true" aria-label={facility.name} style={{ height: '64%' }}>
      <div className="sheet-handle" />
      <div className="sheet-head">
        <div>
          <span className="section-kicker">Facilité</span>
          <h2>{facility.name}</h2>
        </div>
        <span className={`status ${trustClass}`}>{trustLabel}</span>
      </div>

      {/* Buyer body: confirmed/unconfirmed facility with products */}
      {!isUnclaimed && (
        <>
          <div className="omni-fhero">
            <span className="omni-fhero-tag">Photo</span>
          </div>
          <div className="omni-facility-meta-row">
            <span className="tiny muted">
              <MapPin size={9} className="inline-block mr-0.5" />
              {facility.address || 'Lomé, Togo'}
            </span>
            <span className="status ok">Ouvert</span>
          </div>

          {products.length > 0 ? (
            <>
              <div className="omni-label">Produits — sélectionnez (panier de demande)</div>
              <div className="omni-plist">
                {products.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const discount = p.pourcentageReduction || 0;
                  const netPrice = Math.round((p.prixReduit || p.prixOriginal) / 100);
                  const origPrice = Math.round(p.prixOriginal / 100);
                  return (
                    <div
                      key={p.id}
                      className={`omni-pitem${isSelected ? ' sel' : ''}`}
                      onClick={() => toggle(p.id)}
                    >
                      <span className="omni-pitem-thumb" />
                      <span className={`omni-pitem-chk${isSelected ? ' on' : ''}`}>
                        {isSelected ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block text-[12px] text-[#0f0f0f] truncate">{p.name}</b>
                        <small className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                          <span className="font-bold text-[#0f0f0f]">
                            {netPrice.toLocaleString('fr-FR')} {p.currency || 'XOF'}
                          </span>
                          {discount > 0 && (
                            <span className="omni-pitem-disc">-{discount}% Omni</span>
                          )}
                          {origPrice > netPrice && (
                            <span className="text-black/40 line-through">
                              {origPrice.toLocaleString('fr-FR')}
                            </span>
                          )}
                        </small>
                      </span>
                      <span className="omni-pitem-pr">{p.unit || 'unité'}</span>
                    </div>
                  );
                })}
              </div>
              <button
                className="btn ok"
                style={{ marginTop: 10 }}
                onClick={() => onRequestAvailability(facility, selectedIds)}
              >
                Demander la disponibilité ({selCount})
              </button>
              <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>
                Contact vendeur &amp; chat débloqués après intention d'achat.
              </p>
            </>
          ) : (
            <p className="tiny muted" style={{ marginTop: 12, textAlign: 'center' }}>
              Catalogue non publié. Cette facilité n'a pas encore d'offre publique.
            </p>
          )}
        </>
      )}

      {/* Unclaimed body */}
      {isUnclaimed && (
        <>
          <div className="omni-fhero unclaimed">
            <span className="omni-fhero-tag">Non revendiquée</span>
          </div>
          <p className="sub" style={{ marginTop: 8 }}>
            Cette facilité est découvrable mais n'a pas de gestionnaire. Vous pouvez la revendiquer.
          </p>
          <button
            className="btn"
            style={{ marginTop: 10 }}
            onClick={() => (onClaim ? onClaim(facility) : onClose())}
          >
            Revendiquer cette facilité
          </button>
          <button
            className="btn ghost"
            style={{ marginTop: 6 }}
            onClick={() => (onCreateFacility ? onCreateFacility() : onClose())}
          >
            La facilité n'est pas sur la carte ? Créer
          </button>
        </>
      )}
    </section>
  );
}
