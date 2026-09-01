import React from 'react';
import { MapPin, CheckCircle2, AlertCircle, Sparkles, Navigation, Clock, ShieldCheck, ChevronRight, Eye } from 'lucide-react';
import { GlassSurface, GlassButton, GlassBadge } from './LiquidGlass';
import type { PublicFacility, FacilityDetail } from '../../trunk/types';

interface LiquidResultCarouselProps {
  facilities: (PublicFacility | FacilityDetail)[];
  selectedFacilityId: string | null;
  onSelectFacility: (facility: PublicFacility | FacilityDetail) => void;
  onCheckAvailability?: (facility: PublicFacility | FacilityDetail) => void;
  onShowRoute?: (facility: PublicFacility | FacilityDetail) => void;
  className?: string;
}

export function LiquidResultCarousel({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  onCheckAvailability,
  onShowRoute,
  className = '',
}: LiquidResultCarouselProps) {
  if (!facilities || facilities.length === 0) return null;

  return (
    <div className={`w-full pointer-events-auto ${className}`}>
      {/* En-tête des résultats flottants */}
      <div className="flex items-center justify-between px-4 pb-2 text-xs font-semibold text-black/70 drop-shadow-sm">
        <span>{facilities.length} OFFRES DISPONIBLES DANS CE RAYON</span>
        <span className="text-[#234D40] bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/60">
          Remise Omni garantie
        </span>
      </div>

      {/* Carrousel horizontal à défilement fluide */}
      <div className="flex items-stretch gap-3 px-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar">
        {facilities.map((fac) => {
          const isSelected = fac.id === selectedFacilityId;
          const isConfirmed = fac.trust === 'confirmed';
          const hasProducts = (fac as any).productCount > 0 || (fac as any).products?.length > 0;

          return (
            <div
              key={fac.id}
              className="snap-start flex-shrink-0 w-[285px] sm:w-[320px] cursor-pointer"
              onClick={() => onSelectFacility(fac)}
            >
              <GlassSurface
                elevation={isSelected ? 'floating' : 'high'}
                className={`p-3.5 h-full flex flex-col justify-between transition-all duration-200 border ${
                  isSelected
                    ? 'border-[#234D40] ring-2 ring-[#234D40]/20 bg-white'
                    : 'border-white/80 hover:border-[#234D40]/40'
                }`}
              >
                {/* En-tête de carte */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <h4 className="font-display font-semibold text-[#1A1C1B] text-base leading-tight truncate">
                        {fac.name}
                      </h4>
                      <p className="text-xs text-black/50 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-black/40" />
                        {fac.address || 'Lomé, Togo'}
                      </p>
                    </div>

                    {isConfirmed ? (
                      <GlassBadge variant="emerald" id={`badge-confirmed-${fac.id}`}>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span className="font-semibold">Certifié</span>
                      </GlassBadge>
                    ) : (
                      <GlassBadge variant="slate" id={`badge-unclaimed-${fac.id}`}>
                        <span>Vérifié</span>
                      </GlassBadge>
                    )}
                  </div>

                  {/* Badge & Statut */}
                  <div className="flex items-center gap-1.5 flex-wrap my-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-md border border-emerald-200">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> -5% à -15% Omni
                    </span>

                    {hasProducts && (
                      <span className="text-[11px] font-medium text-black/60 bg-black/5 px-2 py-0.5 rounded-md">
                        Catalogue actif
                      </span>
                    )}
                  </div>
                </div>

                {/* Barre d'action rapide */}
                <div className="pt-2.5 border-t border-black/[0.06] flex items-center justify-between gap-2 mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFacility(fac);
                    }}
                    className="text-xs font-semibold text-[#234D40] hover:underline flex items-center gap-1"
                  >
                    <span>Voir l'offre</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {onShowRoute && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowRoute(fac);
                        }}
                        className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-black/70 transition-colors"
                        title="Voir l'itinéraire"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onCheckAvailability && (
                      <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckAvailability(fac);
                        }}
                        className="text-xs py-1 px-3 h-8"
                      >
                        Disponibilité
                      </GlassButton>
                    )}
                  </div>
                </div>
              </GlassSurface>
            </div>
          );
        })}
      </div>
    </div>
  );
}
