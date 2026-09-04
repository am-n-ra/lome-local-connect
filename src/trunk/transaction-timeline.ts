// Gate 5 (T-10b) — timeline verticale de la salle transaction, conforme à la
// maquette acceptée (`docs/maquette/omni-species-maquette.html`, `.txntrack` /
// `.txstep` : étapes empilées, passées = accent, en cours = encre, à venir = neutre).
// Mapping purement visuel : la machine à états (`TransactionState`, types.ts) et
// le stepper 4 confirmations (`transaction-steps.ts`) ne sont pas modifiés.
import type { TransactionState } from './types';

export interface TransactionTimelineStage {
  key: string;
  label: string;
  hint: string;
}

// Ordre canonique de la boucle prouvée en T-08 :
// intent → qr_ready → qr_verified → payment_declared → payment_confirmed
// → fulfilment_pending → fulfilled → received → rated (→ closed).
export const TRANSACTION_TIMELINE: readonly TransactionTimelineStage[] = [
  { key: 'intent', label: 'Intention créée', hint: 'Votre demande d’achat est verrouillée' },
  { key: 'qr', label: 'QR transactionnel', hint: 'Générez puis présentez votre QR au vendeur' },
  { key: 'payment', label: 'Paiement', hint: 'Déclaré par vous, confirmé par le vendeur' },
  { key: 'fulfilment', label: 'Remise', hint: 'Le vendeur prépare puis remet le produit' },
  { key: 'received', label: 'Réception', hint: 'Confirmez la bonne réception' },
  { key: 'rating', label: 'Avis', hint: 'Votre note clôture la transaction' },
] as const;

// Renvoie l'index (0–5) de l'étape « en cours » pour un état donné.
export function transactionTimelineIndex(state: TransactionState): number {
  switch (state) {
    case 'intent_created':
      return 0;
    case 'qr_ready':
      return 1;
    case 'qr_verified':
      return 2;
    case 'payment_declared':
    case 'payment_confirmed':
      return 2;
    case 'fulfilment_pending':
    case 'fulfilled':
      return 3;
    case 'received':
      return 4;
    case 'rated':
    case 'closed':
      return 5;
    default:
      return 0;
  }
}

// true quand la transaction est entièrement clôturée (note publiée).
export function transactionTimelineComplete(state: TransactionState): boolean {
  return state === 'rated' || state === 'closed';
}
