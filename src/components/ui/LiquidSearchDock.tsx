import React, { useState, useRef } from 'react';
import { Search, SlidersHorizontal, QrCode, X } from 'lucide-react';

export interface StructuredDemand {
  rawQuery: string;
  quantity?: number;
  maxBudget?: number;
  maxDistanceKm?: number;
  deliveryMode?: 'pickup' | 'delivery' | 'any';
}

interface LiquidSearchDockProps {
  onSearch: (demand: StructuredDemand) => void;
  onScanQr?: () => void;
  isSearching?: boolean;
}

export function LiquidSearchDock({
  onSearch,
  onScanQr,
  isSearching = false,
}: LiquidSearchDockProps) {
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<number>(5);
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
    setShowAdvanced(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pointer-events-auto flex flex-col items-center gap-2">
      {/* Panneau de filtres contextuels épuré sans emojis */}
      {showAdvanced && (
        <div className="w-full bg-white/90 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5">
            <span className="text-xs font-semibold text-[#1A1C1B] tracking-tight">
              Critères de recherche
            </span>
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="w-6 h-6 rounded-full hover:bg-black/5 flex items-center justify-center text-black/50 hover:text-black transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-medium text-black/60 block mb-1">Quantité</label>
              <div className="flex items-center bg-black/5 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
                <span className="flex-1 text-center text-xs font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-black/60 block mb-1">Budget max (XOF)</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Illimité"
                className="w-full h-9 bg-black/5 rounded-xl px-3 text-xs font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-black/10 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-medium text-black/60 block mb-1">Rayon</label>
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full h-9 bg-black/5 rounded-xl px-2 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-black/60 block mb-1">Mode</label>
              <div className="flex bg-black/5 rounded-xl p-1">
                {(['any', 'pickup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDeliveryMode(m)}
                    className={`flex-1 h-7 rounded-lg text-[10px] font-semibold transition-all ${
                      deliveryMode === m ? 'bg-white shadow-xs text-black' : 'text-black/60'
                    }`}
                  >
                    {m === 'any' ? 'Tous' : 'Retrait'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAdvanced(false);
              handleSubmit();
            }}
            className="w-full h-9 bg-[#234D40] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#1A3B31] transition-all"
          >
            Appliquer les critères
          </button>
        </div>
      )}

      {/* Barre de recherche Liquid Morphism pur type iOS (sans rectangle interne délimité) */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-[#FAF8F5]/85 backdrop-blur-2xl border border-white/60 shadow-[0_16px_40px_rgba(0,0,0,0.08)] rounded-full px-4 py-2 flex items-center gap-3 transition-all duration-300 focus-within:bg-white/95 focus-within:shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
      >
        {/* Bouton recherche réel à gauche */}
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="w-9 h-9 rounded-full bg-[#234D40] text-white flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 flex-shrink-0"
          title="Lancer la recherche"
          aria-label="Rechercher"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>

        {/* Champ de saisie fluide sans bordure rectangulaire interne */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Que cherchez-vous à proximité..."
          className="flex-1 bg-transparent text-sm font-medium text-[#1A1C1B] placeholder:text-black/40 outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center text-black/40 hover:text-black transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="h-5 w-px bg-black/10 flex-shrink-0" />

        {/* Bouton filtres avancés */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
            showAdvanced ? 'bg-[#234D40] text-white' : 'hover:bg-black/5 text-black/60'
          }`}
          title="Filtres"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Bouton QR Code épuré */}
        {onScanQr && (
          <button
            type="button"
            onClick={onScanQr}
            className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#234D40] transition-all flex-shrink-0 active:scale-95"
            title="Scanner un QR code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
}
