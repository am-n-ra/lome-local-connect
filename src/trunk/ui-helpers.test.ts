import { describe, expect, it } from 'vitest';
import { describePendingAction, pendingActionResume } from './ui-helpers';

describe('PendingAction resume contract', () => {
  it('labels each protected action for the access-portal gate', () => {
    expect(describePendingAction({ kind: 'intent', returnTo: 'flow', facilityId: 'f-1', facilityName: 'Ferme omni', productId: 'p-1', productName: 'Pagne', quantity: 2 })).toBe('Secure checkout');
    expect(describePendingAction({ kind: 'seller-entry', returnTo: 'seller-entry' })).toBe('Seller space');
    expect(describePendingAction({ kind: 'claim', returnTo: 'facility', facilityId: 'f-1' })).toBe('Facility claim');
    expect(describePendingAction({ kind: 'search', returnTo: 'search' })).toBe('Search');
    expect(describePendingAction(null)).toBe('');
  });

  it('resumes to the destination sheet with payload after the gate', () => {
    expect(pendingActionResume({ kind: 'intent', returnTo: 'flow', facilityId: 'f-1', facilityName: 'Ferme', productId: 'p-1', productName: 'Pagne', quantity: 2 })).toEqual({ sheet: 'flow', facilityId: 'f-1', facilityName: 'Ferme', productId: 'p-1', productName: 'Pagne' });
    expect(pendingActionResume({ kind: 'seller-entry', returnTo: 'seller-entry' })).toEqual({ sheet: 'seller' });
    expect(pendingActionResume({ kind: 'claim', returnTo: 'facility', facilityId: 'f-1' })).toEqual({ sheet: 'facility', facilityId: 'f-1' });
    expect(pendingActionResume({ kind: 'search', returnTo: 'search' })).toEqual({ sheet: 'search' });
    expect(pendingActionResume(null)).toEqual({ sheet: 'none' });
  });
});