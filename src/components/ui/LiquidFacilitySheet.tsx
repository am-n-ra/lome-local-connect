import React, { useState } from 'react';
import { MapPin, Phone, Clock, ShieldCheck, Sparkles, Navigation, Check, Plus, Minus, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { GlassSurface, GlassButton, GlassBadge, GlassBottomDrawer } from './LiquidGlass';
import type { FacilityDetail } from '../../trunk/types';

interface LiquidFacilitySheetProps {
  facility: FacilityDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestAvailability: (facility: FacilityDetail, selectedProductIds: string[]) => void;
  onShowRoute?: (facility: FacilityDetail) => void;
}

export function LiquidFacilitySheet({
  facility,
  isOpen,
  onClose,
  onRequestAvailability,
  onShowRoute,
}: LiquidFacilitySheetProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  if (!facility || !isOpen) return null;

  const isConfirmed = facility.trust === 'confirmed';
  const products = facility.products || [];

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleStartAvailability = () => {
    onRequestAvailability(facility, selectedProductIds);
  };

  return (
    <GlassBottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      id="liquid-facility-sheet"
      title={
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-xl text-[#1A1C1B] truncate">{facility.name}</h3>
          {isConfirmed ? (
            <GlassBadge variant="emerald">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certifié Omni</span>
            </GlassBadge>
          ) : (
            <GlassBadge variant="slate">
              <span>Vérifié</span>
            </GlassBadge>
          )}
        </div>
      }
      subtitle={
        <div className="flex items-center gap-1.5 text-xs text-black/60 mt-0.5">
          <MapPin className="w-3.5 h-3.5 text-[#234D40]" />
          <span>{facility.address || 'Lomé, Togo'}</span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">Ouvert</span>
        </div>
      }
    >
      <div className="space-y-4 pb-6">
        {/* Règle anti-spam : Coordonnées verrouillées avant l'intention d'achat */}
        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Vérification de stock sans intermédiaire :</span> Les coordonnées directes et l'itinéraire guidé se déverrouillent dès la confirmation d'intention d'achat (*"Je veux acheter"*).
          </div>
        </div>

        {/* Section Catalogue & Sélection Multi-Produits (Availability Basket - B07) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-[#1A1C1B] flex items-center gap-1.5">
              <span>Offres & Catalogue disponibles</span>
              <span className="text-xs font-normal text-black/50">({products.length} articles)</span>
            </h4>
            {selectedProductIds.length > 0 && (
              <span className="text-xs font-semibold text-[#234D40] bg-[#234D40]/10 px-2 py-0.5 rounded-full">
                {selectedProductIds.length} sélectionné(s)
              </span>
            )}
          </div>

          {products.length === 0 ? (
            <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-center text-xs text-black/60">
              Cet établissement n'a pas encore publié d'offres spécifiques, mais vous pouvez vérifier la disponibilité d'un besoin personnalisé.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const discount = p.pourcentageReduction || 0;
                const netPriceXof = Math.round((p.prixReduit || p.prixOriginal) / 100);
                const originalPriceXof = Math.round(p.prixOriginal / 100);

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#234D40]/5 border-[#234D40] shadow-sm'
                        : 'bg-white/70 border-black/[0.06] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#234D40] border-[#234D40] text-white'
                            : 'border-black/20 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#1A1C1B] truncate">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className="font-bold text-[#234D40]">
                            {netPriceXof.toLocaleString('fr-FR')} {p.currency || 'XOF'}
                          </span>
                          {discount > 0 && (
                            <span className="text-[10px] text-[#C0602E] font-semibold bg-[#F08F5A]/15 px-1.5 py-0.2 rounded">
                              -{discount}% Omni
                            </span>
                          )}
                          {originalPriceXof > netPriceXof && (
                            <span className="text-[10px] text-black/40 line-through">
                              {originalPriceXof.toLocaleString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {p.stockLoueOmni > 0 ? `${p.stockLoueOmni} dispo` : 'Stock alloué actif'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bouton d'action principal */}
        <div className="pt-2 flex items-center gap-2">
          {onShowRoute && (
            <GlassButton
              variant="secondary"
              size="lg"
              onClick={() => onShowRoute(facility)}
              className="flex-shrink-0"
              title="Tracer l'itinéraire"
            >
              <Navigation className="w-5 h-5 text-[#234D40]" />
            </GlassButton>
          )}

          <GlassButton
            id="btn-liquid-check-availability"
            variant="primary"
            size="lg"
            onClick={handleStartAvailability}
            className="flex-1"
          >
            <span>
              {selectedProductIds.length > 0
                ? `Vérifier disponibilité (${selectedProductIds.length})`
                : 'Vérifier la disponibilité'}
            </span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </GlassButton>
        </div>
      </div>
    </GlassBottomDrawer>
  );
}
