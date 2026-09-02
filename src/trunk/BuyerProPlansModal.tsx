import React from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export interface BuyerProPlan {
  id: 'pass-24h' | 'mensuel' | 'illimite';
  title: string;
  priceMinor: number;
  period: string;
  description: string;
  tag?: string;
}

export const BUYER_PRO_PLANS: BuyerProPlan[] = [
  {
    id: 'pass-24h',
    title: 'Pass 24h',
    priceMinor: 3000,
    period: '/ 24h',
    description: 'Accès prioritaire immédiat pendant 24 heures.',
  },
  {
    id: 'mensuel',
    title: 'Mensuel Pro',
    priceMinor: 15000,
    period: '/ mois',
    description: 'Vérifications illimitées et alertes temps réel.',
    tag: 'Recommandé',
  },
  {
    id: 'illimite',
    title: 'Annuel Illimité',
    priceMinor: 50000,
    period: '/ an',
    description: 'Toutes les fonctionnalités Pro avec tarif préférentiel.',
    tag: 'Économique',
  },
];

export function formatPlanPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(price);
}

export interface BuyerProPlansModalProps {
  onClose: () => void;
  onSelectPlan?: (planId: string) => void;
}

export function BuyerProPlansModal(props: BuyerProPlansModalProps) {
  const [selectedPlan, setSelectedPlan] = React.useState<'pass-24h' | 'mensuel' | 'illimite'>('mensuel');

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="buyer-pro-modal-title">
      <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet buyer-pro-sheet">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <span className="section-kicker">Omni Privilège</span>
            <h2 id="buyer-pro-modal-title">Formules Acheteur Pro</h2>
          </div>
          <button type="button" onClick={props.onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="buyer-pro-hero">
          <div className="buyer-pro-badge">
            <Sparkles size={16} />
            <span>Crédits de disponibilité en masse</span>
          </div>
          <p className="sheet-lede">
            Obtenez des réponses ultra-rapides et vérifiez simultanément plusieurs facilités grâce à vos crédits de disponibilité en masse.
          </p>
          <div className="credits-counter-card">
            <span className="credits-label">Crédits de disponibilité restants</span>
            <strong className="credits-value">10 vérifications</strong>
          </div>
        </div>

        <div className="buyer-pro-benefits">
          <div className="buyer-benefit-item">
            <CheckCircle2 size={16} className="benefit-icon" />
            <span>Vérification simultanée en masse sur plusieurs facilités</span>
          </div>
          <div className="buyer-benefit-item">
            <CheckCircle2 size={16} className="benefit-icon" />
            <span>Demandes prioritaires traitées en moins de 5 minutes</span>
          </div>
          <div className="buyer-benefit-item">
            <CheckCircle2 size={16} className="benefit-icon" />
            <span>Alertes de réapprovisionnement et suivi de stock en temps réel</span>
          </div>
        </div>

        <div className="buyer-pro-plans-grid" role="radiogroup" aria-label="Choisir une formule">
          {BUYER_PRO_PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={selectedPlan === plan.id}
              className={`buyer-plan-card omni-pressable ${selectedPlan === plan.id ? 'active' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.tag && <div className="plan-tag">{plan.tag}</div>}
              <div className="plan-header">
                <strong>{plan.title}</strong>
                <span className="plan-price">
                  {formatPlanPrice(plan.priceMinor)} <small>{plan.period}</small>
                </span>
              </div>
              <p className="plan-description">{plan.description}</p>
            </button>
          ))}
        </div>

        <div className="locked-note">
          <ShieldCheck size={17} />
          <span>
            <strong>Garantie Omni</strong>
            <small>Paiement sécurisé par FedaPay / Mobile Money. Résiliable à tout moment.</small>
          </span>
        </div>

        <button
          className="primary-button wide omni-pressable"
          type="button"
          onClick={() => {
            props.onSelectPlan?.(selectedPlan);
            props.onClose();
          }}
        >
          Acheter des crédits ({BUYER_PRO_PLANS.find((p) => p.id === selectedPlan)?.title}) <ArrowRight size={16} />
        </button>

        <button className="secondary-button wide omni-pressable" type="button" onClick={props.onClose}>
          Continuer avec le compte standard
        </button>
      </section>
    </div>
  );
}
