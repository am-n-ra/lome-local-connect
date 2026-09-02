import React, { useState } from 'react';
import { X, Building2, Store, MapPin, Check, ArrowRight } from 'lucide-react';

export interface CompanyFacilityOnboardingModalProps {
  onClose: () => void;
  onComplete?: (data: { companyName: string; facilityName: string; category: string; address: string; lat: number; lng: number }) => Promise<boolean | void> | void;
}

export function CompanyFacilityOnboardingModal({ onClose, onComplete }: CompanyFacilityOnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState('');
  const [companyCategory, setCompanyCategory] = useState('Commerce général');
  
  const [facilityName, setFacilityName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(5.3599);
  const [lng, setLng] = useState<number>(-4.0083);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setFacilityName(companyName.trim());
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName.trim() || !address.trim()) return;

    setLoading(true);
    try {
      if (onComplete) {
        await onComplete({
          companyName: companyName.trim(),
          facilityName: facilityName.trim(),
          category: companyCategory,
          address: address.trim(),
          lat,
          lng,
        });
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-seller-title">
      <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet company-onboarding-sheet">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <span className="section-kicker">Création Vendeur Omni</span>
            <h2 id="onboarding-seller-title">
              {step === 1 ? '1. Compagnie' : '2. Facilité (Point de vente)'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="company-stepper-pills" role="tablist" aria-label="Étapes de création">
          <div className={`company-step-pill ${step === 1 ? 'active' : 'done'}`}>
            <Building2 size={15} /> 1. Compagnie
          </div>
          <div className={`company-step-pill ${step === 2 ? 'active' : ''}`}>
            <Store size={15} /> 2. Facilité
          </div>
        </div>

        {step === 1 ? (
          <form className="company-form omni-card-enter" onSubmit={handleStep1Submit}>
            <p className="form-subtext">
              Déclarez votre entreprise pour regrouper vos points de vente et gérer votre catalogue d’offres.
            </p>

            <label className="recharge-input-label">
              Nom de la compagnie / Entreprise *
              <input
                type="text"
                required
                placeholder="Ex: Pharmacie du Port, Boucherie Centrale…"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>

            <label className="recharge-input-label">
              Secteur d’activité principal
              <select
                value={companyCategory}
                onChange={(e) => setCompanyCategory(e.target.value)}
              >
                <option value="Commerce général">Commerce général</option>
                <option value="Santé & Pharmacie">Santé & Pharmacie</option>
                <option value="Alimentation & Épicerie">Alimentation & Épicerie</option>
                <option value="Bricolage & Outillage">Bricolage & Outillage</option>
                <option value="Électronique & High-Tech">Électronique & High-Tech</option>
                <option value="Mode & Vétements">Mode & Vêtements</option>
              </select>
            </label>

            <button className="primary-button wide omni-pressable" type="submit" disabled={!companyName.trim()}>
              Continuer vers le point de vente <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form className="company-form omni-card-enter" onSubmit={handleStep2Submit}>
            <p className="form-subtext">
              Configurez le premier point de vente (facilité) rattaché à <strong>{companyName}</strong>.
            </p>

            <label className="recharge-input-label">
              Nom du point de vente (Facilité) *
              <input
                type="text"
                required
                placeholder="Ex: Agence Principale Plateau"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
              />
            </label>

            <label className="recharge-input-label">
              Adresse physique / Quartier *
              <input
                type="text"
                required
                placeholder="Ex: Boulevard de la République, Face Marché"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>

            <div className="mini-map-picker">
              <div className="mini-map-header">
                <MapPin size={15} /> Position géographique sur la carte
              </div>
              <div className="mini-map-box">
                <div className="mini-map-pin-indicator">
                  <span className="pin-dot" />
                  <span>Emplacement sélectionné ({lat.toFixed(4)}, {lng.toFixed(4)})</span>
                </div>
              </div>
            </div>

            {success ? (
              <div className="seller-response-success" role="status">
                <Check size={18} />
                <span>Compagnie et point de vente créés avec succès !</span>
              </div>
            ) : (
              <div className="form-actions-row">
                <button
                  type="button"
                  className="secondary-button omni-pressable"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="primary-button omni-pressable flex-1"
                  disabled={loading || !facilityName.trim() || !address.trim()}
                >
                  {loading ? 'Création en cours…' : 'Finaliser la création'}
                </button>
              </div>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
