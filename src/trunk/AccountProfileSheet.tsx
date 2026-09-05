import { ArrowLeftRight, Compass, CreditCard, LogOut, Wallet, X } from 'lucide-react';
import type { AccountCapabilitiesResult } from './types';
import type { SessionUser } from './auth-session';

type Props = {
  open: boolean;
  user: SessionUser | null;
  capabilities: AccountCapabilitiesResult | null;
  walletBalance: string | null;
  roleLabel: string;
  onOpenWallet: () => void;
  onOpenPlans: () => void;
  onToggleRole: () => void;
  onSignOut: () => void;
  onClose: () => void;
};

const ROLE_PILL_LABEL: Record<string, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  admin: 'Admin',
  operator: 'Operator',
  reviewer: 'Revue',
};

export function AccountProfileSheet({
  open,
  user,
  capabilities,
  walletBalance,
  roleLabel,
  onOpenWallet,
  onOpenPlans,
  onToggleRole,
  onSignOut,
  onClose,
}: Props) {
  if (!open) return null;

  const roles = capabilities?.roles ?? [];
  const shownRoles = roles.length > 0 ? roles : ['buyer'];
  const facilitiesOwned = capabilities?.facilityCount ?? 0;

  return (
    <section
      className="omni-sheet omni-sheet-enter context-sheet scroll-fade"
      role="dialog"
      aria-modal="true"
      aria-label="Compte Omni"
      style={{ height: 'auto', maxHeight: '72%' }}
    >
      <div className="sheet-handle" />
      <div className="sheet-head">
        <div>
          <span className="section-kicker">Compte</span>
          <h2>Votre profil Omni</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="status ink">{roleLabel}</span>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
      </div>

      {!user ? (
        <div className="cardbox" style={{ marginTop: 11 }}>
          <p className="sub" style={{ marginTop: 0 }}>
            Connectez-vous pour retrouver votre identité, vos rôles et votre portefeuille Omni.
          </p>
          <button type="button" onClick={onOpenPlans} className="btn" style={{ marginTop: 10 }}>
            <Compass size={15} /> Créer mon compte
          </button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>
            Recherche sans compte : la carte et les offres restent consultables.
          </p>
        </div>
      ) : (
        <>
          <div className="cardbox" style={{ marginTop: 11 }}>
            <div className="kv">
              <span>Identité</span>
              <b>{user.name ?? 'Omni'}</b>
            </div>
            <div className="kv">
              <span>Email</span>
              <b>{user.email ?? '—'}</b>
            </div>
            <div className="kv">
              <span>Rôles</span>
              <b className="status ink" style={{ fontSize: 9 }}>
                {shownRoles.map((role) => ROLE_PILL_LABEL[role] ?? role).join(' · ')}
              </b>
            </div>
            {facilitiesOwned > 0 ? (
              <div className="kv">
                <span>Facilités affiliées</span>
                <b>{facilitiesOwned}</b>
              </div>
            ) : null}
            <div className="kv">
              <span>Wallet</span>
              <b>{walletBalance ?? '0,00 $'}</b>
            </div>
          </div>

          <div className="btnrow" style={{ marginTop: 10 }}>
            <button type="button" onClick={onOpenWallet} className="btn ghost sm">
              <Wallet size={14} /> Wallet
            </button>
            <button type="button" onClick={onOpenPlans} className="btn ghost sm">
              <CreditCard size={14} /> Plans
            </button>
          </div>

          {capabilities?.capabilities?.sellerWorkspace ? (
            <button type="button" onClick={onToggleRole} className="btn ghost sm" style={{ marginTop: 8 }}>
              <ArrowLeftRight size={14} /> Basculer vers {roleLabel === 'Seller' ? 'Buyer' : 'Seller'}
            </button>
          ) : null}

          <button type="button" onClick={onSignOut} className="btn ghost sm" style={{ marginTop: 8 }}>
            <LogOut size={14} /> Se déconnecter
          </button>
        </>
      )}
    </section>
  );
}