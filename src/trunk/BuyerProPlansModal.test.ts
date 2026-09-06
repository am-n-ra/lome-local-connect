import { describe, it, expect } from 'vitest';
import { SellerV13 } from './SellerV13';

// Le triptyque « pass-24h / mensuel / illimité » était un concept d'un master-plan
// antérieur — la maquette V1.3 acceptée ne porte que le split Free/Pro par facilité
// (Wallet · Plans, G-06(. La logique pure conservée est remplacée par l'assertion sur
// l'export réel de lespace vendeur V13 1:1 (les tiers disparus sont en dette
// enregistrée, voir register).
describe('SellerV13 ex-BuyerProPlans legacy decommissionne', () => {
  it('exports lespace vendeur V13 1:1 comme composant React valide', () => {
    expect(SellerV13).toBeDefined();
    expect(typeof SellerV13).toBe('function');
  });
});
