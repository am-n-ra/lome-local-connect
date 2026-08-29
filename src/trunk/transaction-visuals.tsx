// PR-I — écran 13 (Avis post-transaction): les 5 étoiles Evergreen et le
// stepper vertical de l'écran 12, sous forme de composants réutilisables par
// le flux acheteur (AvailabilitySheet) et le panneau vendeur.
import { Check, Star } from 'lucide-react';
import type { TransactionState } from './types';
import { TRANSACTION_STEPS, transactionProgress } from './transaction-steps';

// Écran 12 — stepper vertical 4 étapes: terminé = Evergreen plein,
// en cours = mis en évidence, à venir = contour gris.
export function TransactionStepper(props: { state: TransactionState }) {
  const progress = transactionProgress(props.state);
  return <ol className="transaction-stepper" aria-label="Séquence de confirmation de la transaction">
    {TRANSACTION_STEPS.map((label, index) => {
      const step = index + 1;
      const done = progress.completed >= step;
      const current = progress.current === step;
      return <li key={label} className={done ? 'done' : current ? 'current' : ''} aria-current={current ? 'step' : undefined}>
        <span className="transaction-step-mark" aria-hidden="true">{done ? <Check size={13} strokeWidth={3} /> : step}</span>
        <span className="transaction-step-label">{label}</span>
      </li>;
    })}
  </ol>;
}

// Écran 13 — 5 étoiles Evergreen sélectionnables (icônes lucide, pas de
// chiffres nus). Même état et même soumission qu'avant: changement visuel
// uniquement, aria-pressed conservé, libellés français par étoile.
export function RatingStars(props: { value: number; onChange: (score: number) => void }) {
  return <div className="rating-stars" role="group" aria-label="Score du vendeur">
    {[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" className={props.value >= score ? 'filled' : ''} aria-pressed={props.value === score} aria-label={`Noter ${score} sur 5`} onClick={() => props.onChange(score)}>
      <Star size={26} fill={props.value >= score ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>)}
  </div>;
}
