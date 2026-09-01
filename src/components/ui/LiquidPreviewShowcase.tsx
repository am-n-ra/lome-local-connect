import React, { useState } from 'react';
import { Sparkles, Eye, MapPin, Search, QrCode, ShieldCheck, CheckCircle2, ChevronRight, X, User, ShoppingBag, Store, Navigation, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { GlassSurface, GlassButton, GlassBadge, GlassBottomDrawer } from './LiquidGlass';
import { LiquidSearchDock, type StructuredDemand } from './LiquidSearchDock';
import { LiquidResultCarousel } from './LiquidResultCarousel';
import { LiquidFacilitySheet } from './LiquidFacilitySheet';
import { LiquidTransactionRoom, type LiquidTransactionDetails } from './LiquidTransactionRoom';
import { LiquidSellerCockpit } from './LiquidSellerCockpit';
import type { PublicFacility, FacilityDetail } from '../../trunk/types';

interface LiquidPreviewShowcaseProps {
  onDismiss: () => void;
}

// Données de simulation fidèles à l'Intent Brief & Maquette V1
const MOCK_FACILITIES: FacilityDetail[] = [
  {
    id: 'fac-1',
    name: 'Kossi Électronique & Fournitures',
    category: 'Électronique & Maison',
    address: 'Avenue de la Libération, Tokoin, Lomé',
    latitude: 6.1375,
    longitude: 1.2125,
    trust: 'confirmed',
    plan: 'pro_active',
    productCount: 3,
    products: [
      {
        id: 'prod-1',
        facilityId: 'fac-1',
        name: 'Chaise de bureau ergonomique Pro',
        description: 'Fauteuil grand confort soutien lombaire',
        category: 'Maison & Bureau',
        unit: 'pièce',
        couponLabel: 'OMNI10',
        currency: 'XOF',
        stockLoueOmni: 4,
        prixOriginal: 5000000, // 50 000 XOF
        prixReduit: 4500000,   // 45 000 XOF
        pourcentageReduction: 10,
      },
      {
        id: 'prod-2',
        facilityId: 'fac-1',
        name: 'Samsung Galaxy A15 (128 Go)',
        description: 'Smartphone 4G 128 Go officiel',
        category: 'Électronique',
        unit: 'pièce',
        couponLabel: 'OMNI5',
        currency: 'XOF',
        stockLoueOmni: 2,
        prixOriginal: 15000000, // 150 000 XOF
        prixReduit: 14250000,  // 142 500 XOF
        pourcentageReduction: 5,
      },
      {
        id: 'prod-3',
        facilityId: 'fac-1',
        name: 'Chargeur Rapide USB-C 45W',
        description: 'Chargeur GaN rapide certifié',
        category: 'Électronique',
        unit: 'pièce',
        couponLabel: 'OMNI15',
        currency: 'XOF',
        stockLoueOmni: 12,
        prixOriginal: 1400000, // 14 000 XOF
        prixReduit: 1190000,  // 11 900 XOF
        pourcentageReduction: 15,
      },
    ],
  },
  {
    id: 'fac-2',
    name: 'Quincaillerie Générale du Golfe',
    category: 'Bricolage & Équipement',
    address: 'Boulevard Circulaire, Lomé',
    latitude: 6.131,
    longitude: 1.22,
    trust: 'unconfirmed',
    plan: 'free',
    productCount: 1,
    products: [
      {
        id: 'prod-4',
        facilityId: 'fac-2',
        name: 'Lot 10 Chaises pliantes renforcées',
        description: 'Chaises acier légères et robustes',
        category: 'Mobilier',
        unit: 'lot',
        couponLabel: 'OMNI8',
        currency: 'XOF',
        stockLoueOmni: 3,
        prixOriginal: 9000000, // 90 000 XOF
        prixReduit: 8280000,  // 82 800 XOF
        pourcentageReduction: 8,
      },
    ],
  },
];

const MOCK_TRANSACTION_DETAILS: LiquidTransactionDetails = {
  intent: {
    intentId: 'intent-mock-001',
    transactionId: 'txn-mock-8849',
    responseId: 'resp-mock-01',
    buyerAccountId: 'buyer-001',
    state: 'intent_created',
  },
  qrToken: 'OMNI-VAL-2026-XOF-8849-CONFIRMED',
  totalMinor: 5000000,      // 50 000 XOF
  finalPriceMinor: 4500000, // 45 000 XOF (remise 10%)
  currency: 'XOF',
};

export function LiquidPreviewShowcase({ onDismiss }: LiquidPreviewShowcaseProps) {
  const [selectedFacility, setSelectedFacility] = useState<FacilityDetail | null>(MOCK_FACILITIES[0]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [sellerCockpitOpen, setSellerCockpitOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between">
      {/* Barre de navigation principale de la Maquette V1 Liquid Glass */}
      <header className="pointer-events-auto p-3 flex flex-col items-center gap-2 max-w-xl mx-auto w-full">
        <GlassSurface
          elevation="floating"
          className="px-4 py-2 flex flex-col gap-2 border border-white/90 w-full shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-[#1A1C1B] block leading-none">
                  OMNI V1 — LIQUID GLASS PREVIEW
                </span>
                <span className="text-[10px] text-black/50">Maquette interactive officielle V1</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded-lg text-black/50 hover:text-black hover:bg-black/5 transition-colors"
                title="Fermer l'aperçu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Boutons d'accès rapide aux écrans V1 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => {
                setSelectedFacility(MOCK_FACILITIES[0]);
                setSheetOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#234D40]/10 hover:bg-[#234D40]/20 text-[#234D40] whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>B06 Fiche & Panier</span>
            </button>

            <button
              type="button"
              onClick={() => setRoomOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F08F5A]/15 hover:bg-[#F08F5A]/25 text-[#C0602E] whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>B13 QR Room</span>
            </button>

            <button
              type="button"
              onClick={() => setSellerCockpitOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>S01 Cockpit Vendeur</span>
            </button>
          </div>
        </GlassSurface>
      </header>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="pointer-events-auto mx-auto max-w-sm px-4 py-2 bg-slate-900/90 text-white text-xs font-medium rounded-full shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Espace libre permettant de voir l'application en direct */}
      <div className="flex-1 pointer-events-none" />

      {/* B05 - B07 Fiche Établissement & Panier de Disponibilité */}
      <LiquidFacilitySheet
        facility={selectedFacility}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onRequestAvailability={(fac, pids) => {
          showToast(`Demande de disponibilité lancée pour ${pids.length || 1} article(s)`);
          setSheetOpen(false);
          setRoomOpen(true);
        }}
        onShowRoute={(fac) => {
          showToast(`Itinéraire tracé vers ${fac.name}`);
        }}
      />

      {/* B13 - B14 Salle de Transaction & QR Code */}
      {roomOpen && (
        <LiquidTransactionRoom
          details={MOCK_TRANSACTION_DETAILS}
          facility={selectedFacility}
          onClose={() => setRoomOpen(false)}
          onDeclarePayment={() => {
            showToast('Paiement déclaré ! Présentez votre QR au commerçant.');
            setRoomOpen(false);
          }}
        />
      )}

      {/* S01 - S10 Cockpit Vendeur Allégé & Scanner QR */}
      <LiquidSellerCockpit
        isOpen={sellerCockpitOpen}
        onClose={() => setSellerCockpitOpen(false)}
      />
    </div>
  );
}
