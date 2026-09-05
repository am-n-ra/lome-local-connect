import React, { useState } from 'react';
import { X, Search, ShieldCheck, QrCode, ArrowRight, Check } from 'lucide-react';

export interface OnboardingModalProps {
  onClose: () => void;
  onComplete?: () => void;
}

interface Slide {
  id: number;
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ONBOARDING_SLIDES: Slide[] = [
  {
    id: 1,
    badge: '1. Découverte locale',
    title: 'Voir les stocks réels avant de vous déplacer',
    description:
      'Explorez les boutiques, pharmacies, ateliers et commerces de votre quartier. Vérifiez la disponibilité exacte des articles en direct.',
    icon: <Search size={44} className="v3-onboard-icon" />,
  },
  {
    id: 2,
    badge: '2. Confiance et vérification',
    title: 'Transactions sécurisées et traçabilité Omni',
    description:
      'Chaque demande de disponibilité est horodatée. Réglez en espèces au comptoir ou via Mobile Money avec preuve sécurisée.',
    icon: <ShieldCheck size={44} className="v3-onboard-icon" />,
  },
  {
    id: 3,
    badge: '3. Accès direct et QR codes',
    title: 'Retrait rapide en magasin ou livraison',
    description:
      'Présentez votre QR d’intention au vendeur pour valider le produit en un instant et profiter des réductions négociées.',
    icon: <QrCode size={44} className="v3-onboard-icon" />,
  },
];

export function OnboardingModal({ onClose, onComplete }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  // Le paywall est présenté à la fin du parcours de valeur (conversion : tôt,
  // pas au fond de l'app). Il n'est jamais bloquant.
  const [showPaywall, setShowPaywall] = useState(false);

  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      setShowPaywall(true);
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePaywallChoice = (upgrade: boolean) => {
    if (upgrade) {
      onClose();
      return;
    }
    // « Continuer gratuitement » : la décision appartient au parent (ici, enchaîner
    // vers l'identité minimale quand une recherche est en attente). On n'appelle
    // pas onClose ici pour ne pas écraser le panel choisi par onComplete.
    onComplete?.();
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

  if (showPaywall) {
    return (
      <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
        <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet onboarding-sheet">
          <div className="sheet-handle" />
          <div className="sheet-head onboarding-head">
            <span className="section-kicker">Vos plans Omni</span>
            <button type="button" className="text-button skip-button" onClick={onClose} aria-label="Passer (Restez gratuit)">
              Passer <Check size={13} />
            </button>
          </div>
          <div className="onboarding-slide-content">
            <div className="onboarding-badge">Sans engagement</div>
            <h2 id="paywall-title" className="onboarding-title">Commencez gratuitement, passez Pro quand vous voulez.</h2>
            <p className="onboarding-text">
              La recherche avec contraintes et la découverte restent gratuites. Buyer Pro débloque les recherches illimitées et les alertes — sans vous bloquer aujourd’hui.
            </p>
          </div>
          <div className="softplan" style={{ marginTop: 10 }}>
            <div>
              <b style={{ fontSize: 12 }}>Buyer Free</b>
              <br />
              <span style={{ fontSize: 10 }}>Carte, recherche avec contraintes, découverte</span>
            </div>
            <span className="status gray">Actuel</span>
          </div>
          <div className="softplan" style={{ marginTop: 8 }}>
            <div>
              <b style={{ fontSize: 12 }}>Buyer Pro</b>
              <br />
              <span style={{ fontSize: 10 }}>Recherches illimitées + alertes · 5&nbsp;$ / mois</span>
            </div>
            <span className="status ink">5 $</span>
          </div>
          <div className="onboarding-actions">
            <button className="primary-button wide omni-pressable" type="button" onClick={() => handlePaywallChoice(false)}>
              Continuer gratuitement <Check size={16} />
            </button>
            <button className="secondary-button wide omni-pressable" type="button" onClick={() => handlePaywallChoice(true)}>
              Voir les plans Pro <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet onboarding-sheet">
        <div className="sheet-handle" />
        <div className="sheet-head onboarding-head">
          <span className="section-kicker">Bienvenue sur Omni</span>
          <button type="button" className="text-button skip-button" onClick={onClose} aria-label="Passer l'introduction">
            Passer
          </button>
        </div>

        <div className="onboarding-slide-content">
          <div className="onboarding-illustration" aria-hidden="true">
            {slide.icon}
          </div>

          <div className="onboarding-badge">{slide.badge}</div>
          <h2 id="onboarding-title" className="onboarding-title">
            {slide.title}
          </h2>
          <p className="onboarding-text">{slide.description}</p>
        </div>

        <div className="onboarding-dots" role="tablist" aria-label="Progression du guide">
          {ONBOARDING_SLIDES.map((s, index) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={index === currentSlide}
              aria-label={`Étape ${index + 1}`}
              className={`onboard-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          <button className="primary-button wide omni-pressable" type="button" onClick={handleNext}>
            {isLastSlide ? (
              <>
                Commencer à explorer <Check size={16} />
              </>
            ) : (
              <>
                Continuer <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
