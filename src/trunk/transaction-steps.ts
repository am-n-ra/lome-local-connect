// PR-I — écran 12 (Séquence de confirmation): mapping purement visuel des
// états de transaction vers les 4 étapes du stepper. La machine à états
// (TransactionState, types.ts) n'est pas modifiée — ce module ne fait que
// décrire où en est la séquence « Paiement envoyé / reçu / Produit envoyé /
// reçu » pour l'affichage.
import type { TransactionState } from './types';

// Libellés du stepper, tels que spécifiés (écran 12).
export const TRANSACTION_STEPS = ['Paiement envoyé', 'Paiement reçu', 'Produit envoyé', 'Produit reçu'] as const;

export type TransactionProgress = {
  /** Nombre d'étapes terminées (0–4). */
  completed: number;
  /** Étape en cours (1–4), ou null quand les 4 sont terminées. */
  current: number | null;
};

export function transactionProgress(state: TransactionState): TransactionProgress {
  switch (state) {
    case 'payment_declared':
      // L'acheteur a déclaré le paiement, le vendeur doit le confirmer.
      return { completed: 1, current: 2 };
    case 'payment_confirmed':
    case 'fulfilment_pending':
      // Paiement reçu au comptoir, la remise du produit est attendue.
      return { completed: 2, current: 3 };
    case 'fulfilled':
      // Produit remis, l'acheteur doit confirmer la réception.
      return { completed: 3, current: 4 };
    case 'received':
    case 'rated':
    case 'closed':
      // Les 4 confirmations sont passées (l'avis clôture la transaction).
      return { completed: 4, current: null };
    default:
      // intent_created, qr_ready, qr_verified — le paiement n'est pas
      // encore déclaré, la séquence démarre à la première étape.
      return { completed: 0, current: 1 };
  }
}
