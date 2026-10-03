import type { NotificationSummary } from './types';

/**
 * MV1 X03 — les notifications sont des ÉVÉNEMENTS, pas des messages génériques.
 * Chacune porte sa cible : le tap l'ouvre, jamais une page d'accueil.
 *
 * Ce module est PUR : il nomme le libellé français et la cible depuis
 * (eventType, entityType). L'appel réseau (marquer vue) et la navigation vivent
 * dans l'appelant. Une combinaison inconnue rend `none` — jamais une fausse cible.
 */

export type NotificationTarget =
  | { kind: 'flow'; transactionId: string }
  | { kind: 'facility'; facilityId: string }
  | { kind: 'claim-request'; requestId: string }
  | { kind: 'seller' }
  | { kind: 'review' }
  | { kind: 'none' };

export function notificationLabel(notification: Pick<NotificationSummary, 'eventType' | 'reviewOutcome'>): string {
  switch (notification.eventType) {
    case 'transaction_turn': return 'Tour de transaction';
    case 'claim_submitted': return 'Demande à examiner';
    case 'claim_reviewed':
      if (notification.reviewOutcome === 'certified') return 'Lieu vérifié';
      if (notification.reviewOutcome === 'needs_more_evidence') return 'Preuves à compléter';
      if (notification.reviewOutcome === 'rejected') return 'Demande refusée';
      return 'Demande examinée';
    case 'seller_account_activated': return 'Compte vendeur activé';
    case 'seller_account_suspended': return 'Compte vendeur suspendu';
    case 'seller_account_reactivated': return 'Compte vendeur réactivé';
    default: return 'Notification';
  }
}

export function notificationTarget(notification: Pick<NotificationSummary, 'eventType' | 'entityType' | 'entityId'>): NotificationTarget {
  const { eventType, entityType, entityId } = notification;
  if (eventType === 'transaction_turn' && entityType === 'transaction' && entityId) {
    return { kind: 'flow', transactionId: entityId };
  }
  if (eventType === 'claim_reviewed' && entityType === 'verification_request' && entityId) {
    return { kind: 'claim-request', requestId: entityId };
  }
  if (eventType === 'claim_submitted' && entityType === 'verification_request') {
    return { kind: 'review' };
  }
  if (
    (eventType === 'seller_account_activated'
      || eventType === 'seller_account_suspended'
      || eventType === 'seller_account_reactivated')
    && entityType === 'account'
  ) {
    return { kind: 'seller' };
  }
  return { kind: 'none' };
}
