import React from 'react';
import { QrCode, ShieldCheck, CheckCircle2, Copy, Sparkles, Navigation, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import { GlassSurface, GlassButton, GlassBadge } from './LiquidGlass';
import type { PurchaseIntentResult, FacilityDetail } from '../../trunk/types';

export interface LiquidTransactionDetails {
  intent: PurchaseIntentResult;
  qrToken?: string;
  totalMinor: number;
  finalPriceMinor: number;
  currency?: string;
}

interface LiquidTransactionRoomProps {
  details: LiquidTransactionDetails;
  facility: FacilityDetail | null;
  onClose: () => void;
  onDeclarePayment?: () => void;
}

export function LiquidTransactionRoom({
  details,
  facility,
  onClose,
  onDeclarePayment,
}: LiquidTransactionRoomProps) {
  const [copied, setCopied] = React.useState(false);

  const discountAmount = Math.round(details.totalMinor / 100) - Math.round(details.finalPriceMinor / 100);

  const handleCopyCode = () => {
    if (details.qrToken) {
      navigator.clipboard.writeText(details.qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] pointer-events-auto flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[90dvh]">
        {/* En-tête de la Transaction Room */}
        <div className="px-6 pt-5 pb-4 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#234D40] uppercase">
              TRANSACTION ROOM OMNI (B13)
            </span>
            <h3 className="text-lg font-display font-bold text-[#1A1C1B]">
              Intention d'achat verrouillée
            </h3>
          </div>

          <GlassBadge variant="emerald">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sécurisé</span>
          </GlassBadge>
        </div>

        {/* Corps défilant */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Bloc QR Code Transactionnel Opaque (B14) */}
          <GlassSurface
            elevation="high"
            className="p-5 flex flex-col items-center justify-center text-center border-2 border-emerald-500/20 bg-emerald-500/[0.02]"
          >
            <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-md border border-black/10 flex items-center justify-center relative mb-3">
              {/* Simulation QR Code vectoriel */}
              <div className="w-full h-full bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-2">
                <QrCode className="w-24 h-24 text-white opacity-95 mb-1" />
                <span className="text-[9px] font-mono tracking-widest uppercase opacity-80">
                  {details.qrToken ? details.qrToken.slice(0, 16) + '...' : 'OMNI-AUTH-TOKEN'}
                </span>
              </div>
            </div>

            <p className="text-xs text-black/60 max-w-xs mb-2">
              Présentez ce QR code au commerçant lors de votre passage ou de la livraison pour appliquer votre remise Omni.
            </p>

            {details.qrToken && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#234D40] hover:underline"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Code copié !' : 'Copier le code manuel'}</span>
              </button>
            )}
          </GlassSurface>

          {/* Récapitulatif Tarifaire & Remise Omni Exclusive */}
          <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/[0.05] space-y-2">
            <div className="flex items-center justify-between text-xs text-black/60">
              <span>Prix public normal</span>
              <span>{(details.totalMinor / 100).toLocaleString('fr-FR')} {details.currency || 'XOF'}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs font-semibold text-[#C0602E]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Avantage exclusif Omni
                </span>
                <span>-{discountAmount.toLocaleString('fr-FR')} {details.currency || 'XOF'}</span>
              </div>
            )}

            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between">
              <span className="font-semibold text-sm text-[#1A1C1B]">Net à régler au commerçant</span>
              <span className="font-display font-extrabold text-lg text-[#234D40]">
                {(details.finalPriceMinor / 100).toLocaleString('fr-FR')} {details.currency || 'XOF'}
              </span>
            </div>
          </div>

          {/* Coordonnées & Itinéraire Déverrouillés */}
          {facility && (
            <div className="p-4 bg-emerald-500/[0.04] rounded-2xl border border-emerald-500/20 space-y-2">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                COORDONNÉES DÉVERROUILLÉES DU COMMERÇANT
              </div>
              <div className="text-sm font-semibold text-[#1A1C1B]">{facility.name}</div>
              <div className="text-xs text-black/60 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#234D40]" />
                <span>{facility.address || 'Lomé, Togo'}</span>
              </div>
              <div className="text-xs text-black/60 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#234D40]" />
                <span>+228 90 00 00 00 (Contact direct)</span>
              </div>
            </div>
          )}
        </div>

        {/* Barre d'action inférieure */}
        <div className="p-5 border-t border-black/[0.06] flex items-center gap-3">
          <GlassButton variant="secondary" size="md" onClick={onClose} className="flex-1">
            Fermer
          </GlassButton>

          {onDeclarePayment && (
            <GlassButton variant="primary" size="md" onClick={onDeclarePayment} className="flex-1">
              <span>Paiement effectué</span>
              <CheckCircle2 className="w-4 h-4 ml-1" />
            </GlassButton>
          )}
        </div>
      </div>
    </div>
  );
}
