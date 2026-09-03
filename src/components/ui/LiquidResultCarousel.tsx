import { MapPin, ShieldCheck } from 'lucide-react';
import type { PublicFacility } from '../../trunk/types';

type Props = {
  facilities: PublicFacility[];
  selectedFacilityId: string | null;
  onSelectFacility: (fac: PublicFacility) => void;
  className?: string;
};

// Maquette RESULTS sheet: .sheet h-auto with .sheet-head + count + .hgrid of .hcard
export function LiquidResultCarousel({ facilities, selectedFacilityId, onSelectFacility, className = '' }: Props) {
  if (facilities.length === 0) return null;
  return (
    <section className={`omni-sheet omni-sheet-enter context-sheet ${className}`} role="dialog" aria-modal="true" aria-label={`Résultats (${facilities.length})`}>
      <div className="sheet-handle" />
      <div className="sheet-head">
        <div>
          <span className="section-kicker">Résultats</span>
          <h2>Facilités proches</h2>
        </div>
        <span className="maquette-status-pill gray">{facilities.length}</span>
      </div>
      <div className="omni-hgrid" role="list">
        {facilities.map((fac) => {
          const isUnclaimed = fac.trust !== 'confirmed';
          const isSelected = fac.id === selectedFacilityId;
          return (
            <div
              key={fac.id}
              role="listitem"
              className={`omni-hcard${isSelected ? ' sel' : ''}`}
              onClick={() => onSelectFacility(fac)}
            >
              <div className={`omni-hcard-thumb${isUnclaimed ? ' unclaimed' : ''}`}>
                {!isUnclaimed && <span className="omni-hcard-vmark" />}
              </div>
              <div className="omni-hcard-body">
                <b>{fac.name}</b>
                <small>
                  <MapPin size={8} className="inline-block mr-0.5" />
                  {isUnclaimed ? 'Non revendiquée' : fac.address || 'Lomé, Togo'}
                </small>
                {fac.trust === 'confirmed' && (
                  <small className="omni-hcard-trust">
                    <ShieldCheck size={8} className="inline-block mr-0.5" /> Vérifié
                  </small>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
