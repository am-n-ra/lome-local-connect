import React, { useState } from 'react';
import { QrCode, Sparkles, Check, X, ShieldCheck, Layers, ArrowUpRight, Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { GlassSurface, GlassButton, GlassBadge, GlassBottomDrawer } from './LiquidGlass';

interface LiquidSellerCockpitProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiquidSellerCockpit({ isOpen, onClose }: LiquidSellerCockpitProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'stock' | 'scanner'>('pending');
  const [allocatedStock, setAllocatedStock] = useState({
    chaise: 4,
    samsung: 2,
    chargeur: 12,
  });
  const [scanSimulated, setScanSimulated] = useState(false);

  if (!isOpen) return null;

  return (
    <GlassBottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      id="liquid-seller-cockpit"
      title={
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-lg text-[#1A1C1B]">Cockpit Vendeur Omni (S01)</h3>
          <GlassBadge variant="emerald">
            <span className="font-semibold">Boutique Active</span>
          </GlassBadge>
        </div>
      }
      subtitle="Kossi Électronique • Tokoin, Lomé"
    >
      <div className="space-y-4 pb-6">
        {/* Sélecteur d'onglets du Cockpit */}
        <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] rounded-xl border border-black/[0.05]">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-[#234D40] shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            Demandes (1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'stock'
                ? 'bg-white text-[#234D40] shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            Stock Alloué Omni
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'scanner'
                ? 'bg-[#234D40] text-white shadow-sm'
                : 'text-black/60 hover:text-black'
            }`}
          >
            Scanner QR
          </button>
        </div>

        {/* Onglet 1 : Demandes entrantes (S06 - S07 Réponse rapide en 3 clics) */}
        {activeTab === 'pending' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-3.5 bg-[#234D40]/5 rounded-2xl border border-[#234D40]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#234D40] uppercase tracking-wide">
                  Demande de disponibilité directe
                </span>
                <span className="text-xs text-black/50">Il y a 2 min</span>
              </div>

              <div className="text-sm font-semibold text-[#1A1C1B]">
                1x Chaise de bureau ergonomique Pro
              </div>

              <div className="text-xs text-black/60 flex items-center justify-between">
                <span>Client situé à 1.4 km</span>
                <span className="font-bold text-[#234D40]">45 000 XOF (Remise 10% appliquée)</span>
              </div>

              {/* Boutons de réponse rapide V1 en 3 clics */}
              <div className="pt-2 border-t border-black/[0.06] grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => alert('Réponse "Disponible" envoyée instantanément à l\'acheteur.')}
                  className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold text-center shadow-sm"
                >
                  ✓ Disponible
                </button>
                <button
                  type="button"
                  onClick={() => alert('Réponse "Stock partiel" envoyée.')}
                  className="py-2 px-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold text-center shadow-sm"
                >
                  ~ Partiel
                </button>
                <button
                  type="button"
                  onClick={() => alert('Réponse "Indisponible" envoyée.')}
                  className="py-2 px-1 bg-black/10 hover:bg-black/20 text-black/80 rounded-xl text-xs font-semibold text-center"
                >
                  ✕ Épuisé
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 2 : Stock Alloué Omni (S04 - S05 Déclaration sans contrainte POS) */}
        {activeTab === 'stock' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06] text-xs text-black/60">
              <span className="font-semibold text-[#1A1C1B]">Règle V1 :</span> Vous n'avez pas besoin d'un logiciel de caisse complet. Déclarez simplement le quota de pièces que vous réservez à la vente automatique via Omni.
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-white rounded-2xl border border-black/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Chaise de bureau Pro</div>
                  <div className="text-xs text-emerald-700 font-medium">45 000 XOF (-10%)</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocatedStock({ ...allocatedStock, chaise: Math.max(0, allocatedStock.chaise - 1) })}
                    className="w-8 h-8 rounded-lg bg-black/5 border border-black/10 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-6 text-center">{allocatedStock.chaise}</span>
                  <button
                    type="button"
                    onClick={() => setAllocatedStock({ ...allocatedStock, chaise: allocatedStock.chaise + 1 })}
                    className="w-8 h-8 rounded-lg bg-black/5 border border-black/10 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-black/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Samsung Galaxy A15</div>
                  <div className="text-xs text-emerald-700 font-medium">142 500 XOF (-5%)</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocatedStock({ ...allocatedStock, samsung: Math.max(0, allocatedStock.samsung - 1) })}
                    className="w-8 h-8 rounded-lg bg-black/5 border border-black/10 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-6 text-center">{allocatedStock.samsung}</span>
                  <button
                    type="button"
                    onClick={() => setAllocatedStock({ ...allocatedStock, samsung: allocatedStock.samsung + 1 })}
                    className="w-8 h-8 rounded-lg bg-black/5 border border-black/10 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 3 : Scanner QR Vendeur (S10 - S11 Validation de la transaction) */}
        {activeTab === 'scanner' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-[#234D40]">
              {/* Cadre de visée Liquid Glass */}
              <div className="w-36 h-36 border-2 border-emerald-400 rounded-xl relative flex items-center justify-center">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
                <Camera className="w-8 h-8 text-white/50 animate-pulse" />
              </div>

              <div className="absolute bottom-3 inset-x-3 text-center">
                <span className="text-[11px] text-white/80 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  Pointez vers le QR code Omni de l'acheteur
                </span>
              </div>
            </div>

            {scanSimulated ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>QR TOKEN VALIDÉ AVEC SUCCÈS</span>
                </div>
                <div className="text-xs text-black/70">
                  Transaction : <span className="font-mono font-semibold">#TXN-8849</span> • Montant net à encaisser : <span className="font-bold text-[#234D40]">40 500 XOF</span>
                </div>
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    alert('Transaction validée ! Commission Omni enregistrée dans votre solde.');
                    setScanSimulated(false);
                  }}
                  className="w-full mt-1"
                >
                  Confirmer l'encaissement
                </GlassButton>
              </div>
            ) : (
              <GlassButton
                variant="secondary"
                size="md"
                onClick={() => setScanSimulated(true)}
                className="w-full flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#F08F5A]" />
                <span>Simuler le scan d'un QR client</span>
              </GlassButton>
            )}
          </div>
        )}
      </div>
    </GlassBottomDrawer>
  );
}
