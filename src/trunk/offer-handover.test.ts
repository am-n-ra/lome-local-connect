import { describe, expect, it } from 'vitest';
import { handoverIncoherent } from './offer-handover';

describe('offer handover coherence contract (R-I handover)', () => {
  it('refuses a physical pickup on an immaterial offer', () => {
    expect(handoverIncoherent('immaterielle', 'retrait')).toBe(true);
  });
  it('allows every coherent combination', () => {
    expect(handoverIncoherent('immaterielle', 'livraison')).toBe(false);
    expect(handoverIncoherent('immaterielle', 'immateriel')).toBe(false);
    expect(handoverIncoherent('fixe', 'retrait')).toBe(false);
    expect(handoverIncoherent('fixe', 'livraison')).toBe(false);
    // A code handed over at a counter (top-up, ticket, voucher) is real life, not a lie.
    expect(handoverIncoherent('fixe', 'immateriel')).toBe(false);
    expect(handoverIncoherent('mobile', 'retrait')).toBe(false);
    expect(handoverIncoherent('mobile', 'livraison')).toBe(false);
  });
  it('lets an undeclared characteristic through: HANDOVER_REQUIRED speaks there', () => {
    expect(handoverIncoherent(null, 'retrait')).toBe(false);
    expect(handoverIncoherent('immaterielle', null)).toBe(false);
    expect(handoverIncoherent(null, null)).toBe(false);
    expect(handoverIncoherent(undefined, undefined)).toBe(false);
  });
});
