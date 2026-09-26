import { describe, expect, it } from 'vitest';
import { describePendingAction, highlightSearchedProduct, offerCharacteristics, pendingActionResume, sortProductsStockFirst, walletBucketTotals } from './ui-helpers';

describe('PendingAction resume contract', () => {
  it('labels each protected action for the access-portal gate', () => {
    expect(describePendingAction({ kind: 'intent', returnTo: 'flow', facilityId: 'f-1', facilityName: 'Ferme omni', productId: 'p-1', productName: 'Pagne', quantity: 2 })).toBe('Secure checkout');
    expect(describePendingAction({ kind: 'seller-entry', returnTo: 'seller-entry' })).toBe('Seller space');
    expect(describePendingAction({ kind: 'search', returnTo: 'search' })).toBe('Search');
    expect(describePendingAction(null)).toBe('');
  });

  it('resumes to the destination sheet with payload after the gate', () => {
    expect(pendingActionResume({ kind: 'intent', returnTo: 'flow', facilityId: 'f-1', facilityName: 'Ferme', productId: 'p-1', productName: 'Pagne', quantity: 2 })).toEqual({ sheet: 'flow', facilityId: 'f-1', facilityName: 'Ferme', productId: 'p-1', productName: 'Pagne' });
    expect(pendingActionResume({ kind: 'seller-entry', returnTo: 'seller-entry' })).toEqual({ sheet: 'seller' });
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

  it('splits wallet buckets from ledger kinds', () => {
    const totals = walletBucketTotals([
      { kind: 'recharge', amountMinor:  ​1000 },
      { kind: 'bonus_grant', amountMinor:​  ​500 },
      { kind: 'slot_spend', amountMinor:​  ​300 },
      { kind: 'facility_pro_spend', amountMinor:​  ​200 },
    ]);
    expect(totals).toEqual({ creditMinor:1500, spendMinor:500 });
  });
});

describe('COR-7b searched-product highlight contract', () => {
  const products = [
    { id: 'p-chair', name: 'Chaise de bureau' },
    { id: 'p-desk', name: 'Bureau' },
    { id: 'p-rice', name: 'Riz sauce arachide' },
  ];

  it('flags the product whose name matches the search term', () => {
    expect(highlightSearchedProduct(products, 'bureau')).toBe('p-desk');
    expect(highlightSearchedProduct(products, 'riz')).toBe('p-rice');
  });

  it('matches on a meaningful token of a multi-word query', () => {
    expect(highlightSearchedProduct(products, 'chaise de bureau')).toBe('p-chair');
  });

  it('returns null when nothing matches or the query is empty', () => {
    expect(highlightSearchedProduct(products, 'ciment')).toBeNull();
    expect(highlightSearchedProduct(products, '')).toBeNull();
  });
});

describe('offer characteristics (S-01 / R-B)', () => {
  it('renders the declared characteristics in the Seed order', () => {
    expect(offerCharacteristics({ positionKind: 'mobile', uniquenessKind: 'piece_unique', handoverKind: 'livraison', conditionKind: 'occasion', priceKind: 'negociable' })).toEqual([
      { label: 'Position', value: 'Mobile \u00b7 se d\u00e9place' },
      { label: 'Unicit\u00e9', value: 'Pi\u00e8ce unique \u2014 dispara\u00eet apr\u00e8s vente' },
      { label: 'Retrait / livraison', value: 'Livraison' },
      { label: '\u00c9tat', value: 'Occasion' },
      { label: 'Prix', value: '\u00c0 n\u00e9gocier' },
    ]);
  });

  it('omits an undeclared characteristic instead of inventing one', () => {
    expect(offerCharacteristics({ positionKind: 'fixe' })).toEqual([{ label: 'Position', value: 'Fixe \u00b7 sur place' }]);
    expect(offerCharacteristics({})).toEqual([]);
  });
});
