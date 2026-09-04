import { describe, expect, it } from 'vitest';
import { TRANSACTION_TIMELINE, transactionTimelineIndex, transactionTimelineComplete } from './transaction-timeline';

describe('transaction timeline (Gate 5, salle transaction)', () => {
  it('follows the proven T-08 loop order intent → … → rating', () => {
    expect(TRANSACTION_TIMELINE.map((s) => s.key)).toEqual(['intent', 'qr', 'payment', 'fulfilment', 'received', 'rating']);
  });

  it('maps each transaction state to the current stage', () => {
    expect(transactionTimelineIndex('intent_created')).toBe(0);
    expect(transactionTimelineIndex('qr_ready')).toBe(1);
    expect(transactionTimelineIndex('qr_verified')).toBe(2);
    expect(transactionTimelineIndex('payment_declared')).toBe(2);
    expect(transactionTimelineIndex('payment_confirmed')).toBe(2);
    expect(transactionTimelineIndex('fulfilment_pending')).toBe(3);
    expect(transactionTimelineIndex('fulfilled')).toBe(3);
    expect(transactionTimelineIndex('received')).toBe(4);
    expect(transactionTimelineIndex('rated')).toBe(5);
    expect(transactionTimelineIndex('closed')).toBe(5);
  });

  it('is complete only once rated/closed', () => {
    expect(transactionTimelineComplete('received')).toBe(false);
    expect(transactionTimelineComplete('rated')).toBe(true);
    expect(transactionTimelineComplete('closed')).toBe(true);
  });
});
