import { describe, expect, it } from 'vitest';
import { resolveEscape, resolveSellerEntry } from './TrunkApp';

describe('seller entry boundary', () => {
  it('opens the seller boundary directly for an authenticated account', () => {
    expect(resolveSellerEntry('auth-user-1')).toEqual({ kind: 'open-seller-boundary' });
  });

  it('sends an anonymous visitor to Auth with a seller return target', () => {
    expect(resolveSellerEntry(null)).toEqual({ kind: 'authenticate', returnTo: 'seller-entry' });
  });

  it('returns from Seller request detail to the Seller queue on Escape', () => {
    expect(resolveEscape('seller-entry', true)).toBe('seller-queue');
    expect(resolveEscape('seller-entry', false)).toBe('close');
    expect(resolveEscape('availability', false)).toBe('facility');
  });
});
