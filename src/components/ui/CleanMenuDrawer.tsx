import React from 'react';
import { 
  X, LogIn, LogOut, Compass, Sparkles, Download, 
  Search, ShieldCheck, MapPin, Building2, Wallet, Clock3, QrCode 
} from 'lucide-react';
import type { AccountCapabilitiesResult } from '../../trunk/types';
import type { SessionUser } from '../../trunk/auth-session';

type AccountCapabilitiesState = 'idle' | 'loading' | 'ready' | 'error';

interface CleanMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionUser: SessionUser | null;
  accountCapabilitiesState: AccountCapabilitiesState;
  accountCapabilities: AccountCapabilitiesResult | null;
  installPrompt: boolean;
  installed: boolean;
  onOpenAuth: (mode: 'sign-in' | 'sign-up') => void;
  onOpenBuyerRequests: () => void;
  onOpenInbox: () => void;
  onOpenWallet: () => void;
  onOpenBuyerProPlans: () => void;
  onOpenCompanyOnboarding: () => void;
  onOpenSellerScanner: () => void;
  onOpenFieldPilot: () => void;
  onOpenReviewer: () => void;
  onOpenAdminRoles: () => void;
  onOpenOnboarding: () => void;
  onInstallOmni: () => void;
  onSignOut: () => void;
  onResetSearch: () => void;
}

export function CleanMenuDrawer({
  isOpen,
  onClose,
  sessionUser,
  accountCapabilitiesState,
  accountCapabilities,
  installPrompt,
  installed,
  onOpenAuth,
  onOpenBuyerRequests,
  onOpenInbox,
  onOpenWallet,
  onOpenBuyerProPlans,
  onOpenCompanyOnboarding,
  onOpenSellerScanner,
  onOpenFieldPilot,
  onOpenReviewer,
  onOpenAdminRoles,
  onOpenOnboarding,
  onInstallOmni,
  onSignOut,
  onResetSearch,
}: CleanMenuDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop sombre et flouté */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Menu Panneau Cream Glass moderne */}
      <aside 
        id="omni-clean-menu"
        className="fixed top-16 right-4 z-50 w-[320px] max-w-[calc(100vw-32px)] bg-[#FAF8F5]/96 backdrop-blur-3xl border border-white/90 shadow-[0_20px_50px_rgba(20,45,38,0.18),0_4px_16px_rgba(0,0,0,0.06)] rounded-[28px] p-4 text-[#1A1C1B] animate-in fade-in slide-in-from-top-3 duration-250"
        role="menu"
        aria-label="Menu Omni"
      >
        {/* En-tête du menu */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#234D40] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {sessionUser ? sessionUser.name?.slice(0, 2).toUpperCase() : 'OM'}
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#234D40]">
                {sessionUser ? sessionUser.name : 'Omni'}
              </div>
              <div className="text-[11px] text-black/50 font-medium">
                {sessionUser ? (sessionUser.email || 'Membre Omni') : 'Découvrir avant de se déplacer'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-black/40 hover:text-black transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions principales du menu */}
        <div className="py-2.5 space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto no-scrollbar">
          {!sessionUser ? (
            <button
              type="button"
              onClick={() => { onClose(); onOpenAuth('sign-in'); }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#234D40] text-white text-xs font-bold shadow-xs hover:bg-[#1A382F] transition-all"
            >
              <LogIn className="w-4 h-4 text-[#86EFAC]" />
              <span>Se connecter ou créer un compte</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { onClose(); onOpenBuyerRequests(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
              >
                <Clock3 className="w-4 h-4 text-[#234D40]" />
                <span>Mes demandes</span>
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onOpenInbox(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
              >
                <Clock3 className="w-4 h-4 text-[#234D40]" />
                <span>Inbox Omni</span>
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onOpenWallet(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
              >
                <Wallet className="w-4 h-4 text-[#234D40]" />
                <span>Portefeuille Omni</span>
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onOpenBuyerProPlans(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 text-[#F08F5A]" />
                <span>Formules Acheteur Pro</span>
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onOpenCompanyOnboarding(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
              >
                <Building2 className="w-4 h-4 text-[#234D40]" />
                <span>Créer une compagnie / point de vente</span>
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onOpenSellerScanner(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
              >
                <QrCode className="w-4 h-4 text-[#234D40]" />
                <span>Scanner un QR client (Vendeur)</span>
              </button>

              {accountCapabilities?.capabilities.operatorTools && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenFieldPilot(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-[#234D40]" />
                  <span>Outils terrain Omni</span>
                </button>
              )}

              {accountCapabilities?.capabilities.reviewerWorkspace && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenReviewer(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-[#234D40]" />
                  <span>Revue des claims</span>
                </button>
              )}

              {accountCapabilities?.capabilities.adminTools && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenAdminRoles(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/80 hover:bg-black/[0.04] transition-colors text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-[#234D40]" />
                  <span>Gestion des rôles</span>
                </button>
              )}
            </>
          )}

          <div className="pt-2 border-t border-black/[0.06] space-y-1">
            <button
              type="button"
              onClick={() => { onClose(); onOpenOnboarding(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/70 hover:bg-black/[0.04] transition-colors text-left"
            >
              <Compass className="w-4 h-4 text-black/40" />
              <span>Guide de découverte</span>
            </button>

            {installPrompt && !installed && (
              <button
                type="button"
                onClick={() => { onClose(); onInstallOmni(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/70 hover:bg-black/[0.04] transition-colors text-left"
              >
                <Download className="w-4 h-4 text-black/40" />
                <span>Installer Omni</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { onClose(); onResetSearch(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-black/70 hover:bg-black/[0.04] transition-colors text-left"
            >
              <Search className="w-4 h-4 text-black/40" />
              <span>Effacer la recherche</span>
            </button>

            {sessionUser && (
              <button
                type="button"
                onClick={() => { onClose(); onSignOut(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Se déconnecter</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
