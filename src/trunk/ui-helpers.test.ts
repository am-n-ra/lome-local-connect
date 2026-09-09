import { describe, expect, it } from 'vitest';
import { describePendingAction, pendingActionResume, sortProductsStockFirst } from './ui-helpers';

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

  it('orders products so in-stock items lead', () => {
    const items = [
      { id: 'a', name: 'Riz', stockLoueOmni: 0 },
      { id: 'b', name: 'Huile', stockLoueOmni: 4 },
      { id: 'c', name: 'Sel', stockLoueOmni:  ​2 },
      { id: 'd', name: 'Sucre', stockLoueOmni:  ​0 },
    ];
    const sorted = sortProductsStockFirst(items);
    expect(sorted.map((p) => p.id)).toEqual(['b', 'c', 'a', 'd']);
    expect(items.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(sorted).not.toBe(items);
  });
});