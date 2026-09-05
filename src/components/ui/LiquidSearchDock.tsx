import { useState, useRef } from 'react';
import { Search, QrCode, X, ArrowRight } from 'lucide-react';

export interface StructuredDemand {
  rawQuery: string;
  quantity?: number;
  maxBudget?: number;
  maxDistanceKm?: number;
  deliveryMode?: 'pickup' | 'delivery' | 'any';
}

interface Props {
  onSearch: (demand: StructuredDemand) => void;
  onScanQr?: () => void;
  isSearching?: boolean;
  /** V1.3 desktop coquille : force la rangée de contraintes visible
   * même sans frappe (top bar permanente). */
  constraintsPersistent?: boolean;
}

const DISTANCES = [
  { km: 1, label: '1 km — quartier' },
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
  { km: 25, label: '25 km — ville' },
  { km: 100, label: '100 km — région' },
  { km: 0, label: 'Monde entier' },
] as const;

// Maquette SEARCH sheet: .searchdock .fld — pill 34px, loupe + input + bouton « → »;
// contraintes (chips) se révèlent à la frappe, pas un panneau séparé.
export function LiquidSearchDock({ onSearch, onScanQr, isSearching = false, constraintsPersistent = false }: Props) {
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [maxBudget, setMaxBudget] = useState('');
  const [maxDistance, setMaxDistance] = useState(5);
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery' | 'any'>('any');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    onSearch({
      rawQuery: query.trim(),
      quantity: quantity > 1 ? quantity : undefined,
      maxBudget: maxBudget ? parseInt(maxBudget, 10) : undefined,
      maxDistanceKm: maxDistance,
      deliveryMode,
    });
  };

  const typing = query.trim().length > 0;

  return (
    <div className="searchdock">
      <form className="fld" onSubmit={handleSubmit}>
        {isSearching ? (
          <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-[#0f0f0f] rounded-full animate-spin" aria-hidden="true" />
        ) : (
          <Search width={16} height={16} aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Produit, service, commerce…"
          aria-label="Recherche"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Effacer" className="fld-clear">
            <X width={13} height={13} />
          </button>
        )}
        <button type="submit" className="fld-go" disabled={isSearching || !query.trim()} aria-label="Rechercher">
          <ArrowRight width={14} height={14} />
        </button>
      </form>

      {/* Maquette V1.1 constraintZone: chips pleines avec pastille (dot) qui se révèlent à la frappe (toujours visibles sur la top bar desktop V1.3) */}
      {(typing || constraintsPersistent) && (
        <div className="constraintZone omni-sheet-enter">
          <div className="constraintLabel">Contraintes (requête, pas engagement vendeur)</div>
          <div className="chips">
            <label className={`chip${quantity > 1 ? ' active' : ''}`}>
              <span className="dot" />
              <span>Qté</span>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} aria-label="Quantité" />
            </label>
            <label className={`chip${maxBudget ? ' active' : ''}`}>
              <span className="dot" />
              <span>Budget</span>
              <input type="number" min={0} value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="∞" aria-label="Budget maximum" />
            </label>
            <label className="chip select">
              <span className="dot" />
              <span>Rayon</span>
              <select value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} aria-label="Rayon">
                {DISTANCES.map((d) => <option key={d.km} value={d.km}>{d.label}</option>)}
              </select>
            </label>
            {(['any', 'pickup', 'delivery'] as const).map((m) => (
              <button key={m} type="button" className={`chip${deliveryMode === m ? ' active' : ''}`} onClick={() => setDeliveryMode(m)}>
                <span className="dot" />
                {m === 'any' ? 'Tous' : m === 'pickup' ? 'Retrait' : 'Livraison'}
              </button>
            ))}
            {onScanQr && (
              <button type="button" className="chip" onClick={onScanQr} aria-label="Scanner un QR">
                <span className="dot" />
                <QrCode width={12} height={12} /> QR
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
