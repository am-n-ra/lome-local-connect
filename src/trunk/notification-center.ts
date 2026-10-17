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
  | { kind: 'room'; transactionId: string }
  | { kind: 'facility'; facilityId: string }
  | { kind: 'claim-request'; requestId: string }
  | { kind: 'seller' }
  | { kind: 'seller-queue' }
  | { kind: 'review' }
  | { kind: 'availability-response'; requestId: string }
  | { kind: 'search'; query: string; level: 'offer' | 'entity' }
  | { kind: 'none' };

export function notificationLabel(notification: Pick<NotificationSummary, 'eventType' | 'reviewOutcome'>): string {
  switch (notification.eventType) {
    case 'transaction_turn': return 'Tour de transaction';
    case 'transaction_intent_created': return 'Une intention d’achat vous attend';
    case 'availability_response_created': return 'Réponse à votre demande';
    case 'availability_request_created': return 'Nouvelle demande de disponibilité';
    // TXN-G7 (GAP-7) : l'expiration était silencieuse. Chaque partie a son libellé.
    case 'availability_request_expired': return 'Votre demande a expiré';
    case 'availability_response_lapsed': return 'Demande expirée sans transaction';
    case 'claim_submitted': return 'Demande à examiner';
    case 'claim_reviewed':
      if (notification.reviewOutcome === 'certified') return 'Lieu vérifié';
      if (notification.reviewOutcome === 'needs_more_evidence') return 'Preuves à compléter';
      if (notification.reviewOutcome === 'rejected') return 'Demande refusée';
      return 'Demande examinée';
    case 'seller_account_activated': return 'Compte vendeur activé';
    case 'seller_account_suspended': return 'Compte vendeur suspendu';
    case 'seller_account_reactivated': return 'Compte vendeur réactivé';
    // NR-10 — l'alerte acheteur. La promesse « être alerté » de la sheet « Recherches
    // enregistrées » n'avait aucun producteur : on ne pouvait être alerté de rien.
    case 'saved_search_match': return 'Une offre correspond à votre alerte';
    default: return 'Notification';
  }
}

export function notificationTarget(notification: Pick<NotificationSummary, 'eventType' | 'entityType' | 'entityId'>): NotificationTarget {
  const { eventType, entityType, entityId } = notification;
  if (eventType === 'transaction_turn' && entityType === 'transaction' && entityId) {
    return { kind: 'flow', transactionId: entityId };
  }
  // NR-4 / S-27 — une intention d'achat ouvre la ROOM de cette transaction (fil complet),
  // pas le suivi court du flux : c'est là que le vendeur valide et converse.
  if (eventType === 'transaction_intent_created' && entityType === 'transaction' && entityId) {
    return { kind: 'room', transactionId: entityId };
  }
  if (eventType === 'availability_response_created' && entityType === 'availability_request' && entityId) {
    return { kind: 'availability-response', requestId: entityId };
  }
  if (eventType === 'availability_request_created' && entityType === 'availability_request') {
    return { kind: 'seller-queue' };
  }
  // TXN-G7 (GAP-7) — l'acheteur dont la demande a expiré rouvre le SUIVI de sa demande
  // (il y lit « Rien n'a été débité ») ; le vendeur qui avait répondu rouvre sa file.
  if (eventType === 'availability_request_expired' && entityType === 'availability_request' && entityId) {
    return { kind: 'availability-response', requestId: entityId };
  }
  if (eventType === 'availability_response_lapsed' && entityType === 'availability_request') {
    return { kind: 'seller-queue' };
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
  // NR-10 — l'alerte ouvre la RECHERCHE (les résultats), pas un écran générique : c'est là
  // que l'acheteur voit l'offre qui correspond. `entityId` porte la requête sauvegardée.
  if (eventType === 'saved_search_match' && entityType === 'saved_search' && entityId) {
    return { kind: 'search', query: entityId, level: 'offer' };
  }
  return { kind: 'none' };
}
