import { describe, it, expect } from 'vitest';
import { SellerV13 } from './SellerV13';

describe('SellerV13 ex-SellerScanner legacy decommissionne', () => {
  it('exports lespace vendeur V13 1:1 comme composant React valide', () => {
    expect(SellerV13).toBeDefined();
    expect(typeof SellerV13).toBe('function');
  });
});
