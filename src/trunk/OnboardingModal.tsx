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

  const isLast = currentSlide === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete?.();
      onClose();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

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
            {isLast ? (
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
