import { describe, expect, it } from 'vitest';
import { notificationLabel, notificationTarget } from './notification-center';

describe('notification centre contract (MV1 X03)', () => {
  it('names every known event in French, distinctly', () => {
    expect(notificationLabel({ eventType: 'transaction_turn' })).toBe('Tour de transaction');
    expect(notificationLabel({ eventType: 'claim_submitted' })).toBe('Demande à examiner');
    expect(notificationLabel({ eventType: 'claim_reviewed', reviewOutcome: 'certified' })).toBe('Lieu vérifié');
    expect(notificationLabel({ eventType: 'claim_reviewed', reviewOutcome: 'needs_more_evidence' })).toBe('Preuves à compléter');
    expect(notificationLabel({ eventType: 'claim_reviewed', reviewOutcome: 'rejected' })).toBe('Demande refusée');
    expect(notificationLabel({ eventType: 'seller_account_activated' })).toBe('Compte vendeur activé');
    expect(notificationLabel({ eventType: 'seller_account_suspended' })).toBe('Compte vendeur suspendu');
    expect(notificationLabel({ eventType: 'seller_account_reactivated' })).toBe('Compte vendeur réactivé');
    expect(notificationLabel({ eventType: 'availability_request_created' })).toBe('Nouvelle demande de disponibilité');
    expect(notificationLabel({ eventType: 'availability_response_created' })).toBe('Réponse à votre demande');
    // TXN-G7 (GAP-7) — l'expiration était silencieuse ; chaque partie a son libellé.
    expect(notificationLabel({ eventType: 'availability_request_expired' })).toBe('Votre demande a expiré');
    expect(notificationLabel({ eventType: 'availability_response_lapsed' })).toBe('Demande expirée sans transaction');
    expect(notificationLabel({ eventType: 'something_new' })).toBe('Notification');
  });

  it('routes each event to its source object, never to a generic page', () => {
    expect(notificationTarget({ eventType: 'transaction_turn', entityType: 'transaction', entityId: 'txn-1' }))
      .toEqual({ kind: 'flow', transactionId: 'txn-1' });
    // BRANCHES-NOTIF-1 — a seller's response reopens the buyer's request suivi (by request id).
    expect(notificationTarget({ eventType: 'availability_response_created', entityType: 'availability_request', entityId: 'req-9' }))
      .toEqual({ kind: 'availability-response', requestId: 'req-9' });
    // BRANCHES-NOTIF-1 — a new request opens the seller's queue (no per-request surface).
    expect(notificationTarget({ eventType: 'availability_request_created', entityType: 'availability_request', entityId: 'req-9' }))
      .toEqual({ kind: 'seller-queue' });
    // TXN-G7 (GAP-7) — l'acheteur expiré rouvre le suivi de sa demande ; le vendeur, sa file.
    expect(notificationTarget({ eventType: 'availability_request_expired', entityType: 'availability_request', entityId: 'req-9' }))
      .toEqual({ kind: 'availability-response', requestId: 'req-9' });
    expect(notificationTarget({ eventType: 'availability_response_lapsed', entityType: 'availability_request', entityId: 'req-9' }))
      .toEqual({ kind: 'seller-queue' });
    expect(notificationTarget({ eventType: 'claim_reviewed', entityType: 'verification_request', entityId: 'req-1' }))
      .toEqual({ kind: 'claim-request', requestId: 'req-1' });
    expect(notificationTarget({ eventType: 'claim_submitted', entityType: 'verification_request', entityId: 'req-2' }))
      .toEqual({ kind: 'review' });
    expect(notificationTarget({ eventType: 'seller_account_activated', entityType: 'account', entityId: 'acc-1' }))
      .toEqual({ kind: 'seller' });
  });

  it('refuses an unknown or identifier-less event instead of misrouting it', () => {
    expect(notificationTarget({ eventType: 'something_new', entityType: 'transaction', entityId: 'txn-1' }))
      .toEqual({ kind: 'none' });
    expect(notificationTarget({ eventType: 'transaction_turn', entityType: 'transaction', entityId: '' }))
      .toEqual({ kind: 'none' });
    expect(notificationTarget({ eventType: 'transaction_turn', entityType: 'account', entityId: 'acc-1' }))
      .toEqual({ kind: 'none' });
  });
});
