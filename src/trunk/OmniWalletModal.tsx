import React, { useState } from 'react';
import { X, Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, RefreshCw, PlusCircle, CheckCircle2 } from 'lucide-react';
import { NeutralLockedCreditBadge } from './v3';

export interface WalletTransactionItem {
  id: string;
  type: 'credit' | 'debit' | 'locked';
  label: string;
  date: string;
  amountMinor: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'failed';
}

export interface OmniWalletModalProps {
  onClose: () => void;
  balanceMinor?: number;
  currency?: string;
  onRecharge?: (amountMinor: number, method: string) => Promise<boolean> | void;
}

const SAMPLE_TRANSACTIONS: WalletTransactionItem[] = [
  {
    id: 'tx-1',
    type: 'credit',
    label: 'Recharge Mobile Money (Wave)',
    date: 'Aujourd’hui, 14:20',
    amountMinor: 10000,
    currency: 'XOF',
    status: 'confirmed',
  },
  {
    id: 'tx-2',
    type: 'debit',
    label: 'Réservation pharmacie du Port',
    date: 'Hier, 18:45',
    amountMinor: 3500,
    currency: 'XOF',
    status: 'confirmed',
  },
  {
    id: 'tx-3',
    type: 'credit',
    label: 'Prime de bienvenue Omni (Verrouillée)',
    date: '24 août 2026',
    amountMinor: 12000,
    currency: 'XOF',
    status: 'pending',
  },
];

export function OmniWalletModal(props: OmniWalletModalProps) {
  const [recharging, setRecharging] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('5000');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange' | 'mtn' | 'moov'>('wave');
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const balance = props.balanceMinor ?? 16500;
  const currencySymbol = 'CFA';

  const presets = [2000, 5000, 10000, 25000];

  const handleSelectPreset = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount(amount.toString());
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(customAmount) || selectedPreset;
    if (amount <= 0) return;

    setLoading(true);
    try {
      if (props.onRecharge) {
        await props.onRecharge(amount, paymentMethod);
      } else {
        // Simulation rapide
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      setRechargeSuccess(true);
      setTimeout(() => {
        setRecharging(false);
        setRechargeSuccess(false);
      }, 1400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title">
      <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet omni-wallet-sheet">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <span className="section-kicker">Omni Finance</span>
            <h2 id="wallet-modal-title">Portefeuille Omni</h2>
          </div>
          <button type="button" onClick={props.onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Hero Balance Card */}
        <div className="wallet-hero-card">
          <div className="wallet-balance-header">
            <span className="wallet-balance-label">Solde disponible</span>
            <NeutralLockedCreditBadge amount="20$" />
          </div>
          <div className="wallet-balance-amount">
            {balance.toLocaleString('fr-FR')} <span className="currency">{currencySymbol}</span>
          </div>
          <p className="wallet-subtext">Crédits utilisables pour les demandes prioritaires et les réservations directes.</p>

          {!recharging && (
            <button
              className="primary-button wide omni-pressable"
              type="button"
              onClick={() => setRecharging(true)}
            >
              <PlusCircle size={17} /> Recharger mon solde
            </button>
          )}
        </div>

        {/* Recharge Form Section */}
        {recharging && (
          <form className="wallet-recharge-form omni-card-enter" onSubmit={handleRechargeSubmit}>
            <div className="recharge-form-head">
              <strong>Recharger via Mobile Money</strong>
              <button type="button" className="text-button" onClick={() => setRecharging(false)}>
                Annuler
              </button>
            </div>

            <div className="preset-chips" role="group" aria-label="Montants prédéfinis">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`preset-chip ${selectedPreset === preset ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  +{preset.toLocaleString('fr-FR')} CFA
                </button>
              ))}
            </div>

            <label className="recharge-input-label">
              Montant personnalisé (CFA)
              <input
                type="number"
                min="500"
                step="500"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPreset(Number(e.target.value));
                }}
                required
              />
            </label>

            <div className="payment-method-pills" role="radiogroup" aria-label="Opérateur de paiement">
              {[
                { id: 'wave', label: 'Wave' },
                { id: 'orange', label: 'Orange Money' },
                { id: 'mtn', label: 'MTN MoMo' },
                { id: 'moov', label: 'Moov Money' },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === op.id}
                  className={`operator-pill ${paymentMethod === op.id ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(op.id as typeof paymentMethod)}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {rechargeSuccess ? (
              <div className="seller-response-success" role="status">
                <CheckCircle2 size={18} />
                <span>Recharge confirmée ! Votre solde a été mis à jour.</span>
              </div>
            ) : (
              <button className="primary-button wide omni-pressable" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" /> Connexion à l’opérateur…
                  </>
                ) : (
                  `Payer ${Number(customAmount || 0).toLocaleString('fr-FR')} CFA`
                )}
              </button>
            )}
          </form>
        )}

        {/* Transaction History */}
        <div className="wallet-history-section">
          <div className="wallet-history-head">
            <span className="section-kicker">Historique</span>
            <small>Dernières opérations</small>
          </div>

          <div className="wallet-transaction-list" role="feed" aria-label="Historique des transactions">
            {SAMPLE_TRANSACTIONS.map((tx) => {
              const isCredit = tx.type === 'credit';
              return (
                <div key={tx.id} className="wallet-tx-row">
                  <div className={`tx-icon-bubble ${tx.type}`}>
                    {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="tx-details">
                    <strong className="tx-label">{tx.label}</strong>
                    <small className="tx-date">{tx.date}</small>
                  </div>
                  <div className={`tx-amount ${tx.type}`}>
                    {isCredit ? '+' : '-'}
                    {tx.amountMinor.toLocaleString('fr-FR')} CFA
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="locked-note">
          <ShieldCheck size={17} />
          <span>
            <strong>Garantie de remboursement Omni</strong>
            <small>Les crédits non consommés lors d&apos;une demande sont restitués automatiquement sous 15 minutes.</small>
          </span>
        </div>

        <button className="secondary-button wide omni-pressable" type="button" onClick={props.onClose}>
          Fermer
        </button>
      </section>
    </div>
  );
}
