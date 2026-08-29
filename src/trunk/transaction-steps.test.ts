import { describe, expect, it } from 'vitest';
import { TRANSACTION_STEPS, transactionProgress } from './transaction-steps';

// PR-I — écran 12: le stepper de confirmation est purement visuel, mais le
// mapping état → étapes doit rester fidèle à la machine à états réelle.
describe('transactionProgress', () => {
  it('exposes the 4 confirmation steps from the spec (écran 12)', () => {
    expect(TRANSACTION_STEPS).toEqual(['Paiement envoyé', 'Paiement reçu', 'Produit envoyé', 'Produit reçu']);
  });

  it('starts at step 1 before the buyer declares the payment', () => {
    for (const state of ['intent_created', 'qr_ready', 'qr_verified'] as const) {
      expect(transactionProgress(state)).toEqual({ completed: 0, current: 1 });
    }
  });

  it('marks step 1 done and waits on step 2 once the payment is declared', () => {
    expect(transactionProgress('payment_declared')).toEqual({ completed: 1, current: 2 });
  });

  it('marks payment received and waits on the product handover', () => {
    expect(transactionProgress('payment_confirmed')).toEqual({ completed: 2, current: 3 });
    expect(transactionProgress('fulfilment_pending')).toEqual({ completed: 2, current: 3 });
  });

  it('marks the product handed over and waits on the buyer reception', () => {
    expect(transactionProgress('fulfilled')).toEqual({ completed: 3, current: 4 });
  });

  it('completes the sequence once the product is received (and stays complete after rating)', () => {
    expect(transactionProgress('received')).toEqual({ completed: 4, current: null });
    expect(transactionProgress('rated')).toEqual({ completed: 4, current: null });
    expect(transactionProgress('closed')).toEqual({ completed: 4, current: null });
  });
});
