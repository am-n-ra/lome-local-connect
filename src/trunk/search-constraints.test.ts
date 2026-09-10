import { describe, expect, it } from 'vitest';
import { chipHintFor, chipOptionsFor, chipStatusFor, chipsToSearchOptions, summarizeActiveChips } from './search-constraints';

describe('search constraint helpers (NW-12.1', () => {
  it('wires buyer chips to real server options', () => {
    expect(chipOptionsFor('Quantité 10')).toEqual({ quantiteMin: 10 });
    expect(chipOptionsFor('≤ 15 000 FCFA')).toEqual({ budgetMaxMinor: 1_500_000 });
    expect(chipOptionsFor('≤ 10 km')).toEqual({ rayonKm: 10 });
    expect(chipOptionsFor('Ouvert')).toEqual({ operationalState: 'ouvert' });
  });

  it('marks non-wired chips as soon, never decorative', () => {
    for (const label of ['Livraison', 'Transactable', 'Ma compagnie', 'Claims', 'Tournée du jour']) {
      expect(chipStatusFor(label)).toBe('soon');
      expect(chipOptionsFor(label)).toBeUndefined();
    }
  });

  it('assembles SearchOptions from active wired chips only', () => {
    const options = chipsToSearchOptions(new Set(['Quantité 10', '≤ 10 km', 'Ouvert', 'Livraison']));
    expect(options).toEqual({ category: '', quantiteMin: 10, rayonKm: 10, operationalState: 'ouvert' });
  });

  it('summarizes only applied intentions for the search field', () => {
    expect(summarizeActiveChips(new Set(['Quantité 10', '≤ 15 000 FCFA', 'Livraison']))).toEqual(['Quantité 10', '15 000 FCFA']);
  });

  it('exposes honest soon hints', () => {
    expect(chipHintFor('Livraison')).toContain('Bientôt');
    expect(chipHintFor('Ouvert')).toBe('Exclut les facilités fermées');
  });
});